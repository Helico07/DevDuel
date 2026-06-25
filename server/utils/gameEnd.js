import { BattleResult } from "../models/battleResult.model.js"
import { User }         from "../models/user.model.js"
import calculateEloChange from "./elo.js"

// ─── SHARED GAME-END HANDLER ──────────────────────────────────────────────────
// Called when BOTH players have answered all questions — either from:
//   A) matchMaking.js  → when the real player submits their last answer
//   B) botEngine.js    → when the bot finishes its last simulated answer
//
// Extracting this into a shared utility avoids duplicating the DB write + emit
// logic across two files. Any future change (e.g. achievements, streaks) only
// needs to be made here.

export const handleGameEnd = async ({ session, roomId, io, activeSessions }) => {

    const s              = session
    const totalQuestions = s.questions.length

    // ── DETERMINE WINNER ──────────────────────────────────────────────────────
    // Tiebreaker: if scores are equal, whoever finished all questions first wins.
    // finishedFirst is set the moment a player's answerCount hits totalQuestions.
    let winner, loser

    if (s.player1.score === s.player2.score) {
        winner = s.finishedFirst
        loser  = s.player1.userName === winner ? s.player2.userName : s.player1.userName
    } else if (s.player1.score > s.player2.score) {
        winner = s.player1.userName
        loser  = s.player2.userName
    } else {
        winner = s.player2.userName
        loser  = s.player1.userName
    }

    const winnerId = s.player1.userName === winner ? s.player1.userId : s.player2.userId
    const loserId  = s.player1.userName === winner ? s.player2.userId : s.player1.userId


    // ── BOT MATCH PATH ────────────────────────────────────────────────────────
    // Only the real player's (player1) rating changes.
    // The bot is not a DB document — we can't findByIdAndUpdate "bot".
    if (s.isBot) {

        const realPlayer       = s.player1     // worker always sets real player as player1
        const didRealPlayerWin = winner === realPlayer.userName

        // Fetch real player's current stats for the Elo formula
        const realUser = await User.findById(realPlayer.userId).select("rating contestsPlayed")

        // Bot's Elo is stored on player2 by the worker (equals real player's Elo at match time)
        // We pass bot treated as a "veteran" (30+ games) so its K-factor is 16, not 32,
        // giving the real player slightly more stable rating changes against bots.
        const botElo = s.player2.elo ?? realUser.rating

        const { winnerDelta, loserDelta } = calculateEloChange(
            didRealPlayerWin ? realUser.rating : botElo,
            didRealPlayerWin ? botElo          : realUser.rating,
            didRealPlayerWin ? realUser.contestsPlayed : 30,
            didRealPlayerWin ? 30              : realUser.contestsPlayed
        )

        const ratingChange = didRealPlayerWin ? winnerDelta : -loserDelta
        const newRating    = realUser.rating + ratingChange

        await User.findByIdAndUpdate(realPlayer.userId, {
            $inc  : {
                rating        : ratingChange,
                contestsPlayed: 1,
                ...(didRealPlayerWin ? { contestsWon: 1 } : {}),
                totalAttempted: totalQuestions,
                questionsSolved: s.correctCount[realPlayer.userName]
            },
            $push : {
                ratingHistory: {
                    $each  : [{ elo: newRating, date: new Date() }],
                    $slice : -50
                }
            }
        })

        // Save bot match to BattleResult with isBot flag for dashboard filtering
        await BattleResult.create({
            player1: { userId: s.player1.userId, userName: s.player1.userName, score: s.player1.score },
            player2: { userId: null,              userName: s.player2.userName, score: s.player2.score },
            winner,
            roomId,
            isBot: true
        })

        io.to(roomId).emit("game:end", {
            winner,
            player1      : { userName: s.player1.userName, score: s.player1.score },
            player2      : { userName: s.player2.userName, score: s.player2.score },
            ratingChanges: { winner: Math.abs(ratingChange), loser: 0 },
            isBot        : true
        })


    // ── REAL vs REAL PATH ─────────────────────────────────────────────────────
    } else {

        // Fetch both players' current ratings for the Elo calculation.
        // We need the CURRENT rating (not session-start rating) because another
        // match might have updated it between session start and game end.
        // Promise.all runs both queries in parallel — no sequential waterfall.
        const [winnerUser, loserUser] = await Promise.all([
            User.findById(winnerId).select("rating contestsPlayed"),
            User.findById(loserId).select("rating contestsPlayed")
        ])

        const { winnerDelta, loserDelta } = calculateEloChange(
            winnerUser.rating,
            loserUser.rating,
            winnerUser.contestsPlayed,
            loserUser.contestsPlayed
        )

        // Run both DB writes in parallel — no reason to wait for one before the other
        const [winnerNewRating, loserNewRating] = [
            winnerUser.rating + winnerDelta,
            loserUser.rating  - loserDelta
        ]

        await Promise.all([
            BattleResult.create({
                player1: { userId: s.player1.userId, userName: s.player1.userName, score: s.player1.score },
                player2: { userId: s.player2.userId, userName: s.player2.userName, score: s.player2.score },
                winner,
                roomId,
                isBot: false
            }),
            User.findByIdAndUpdate(winnerId, {
                $inc  : {
                    rating        :  winnerDelta,
                    contestsPlayed: 1,
                    contestsWon   : 1,
                    totalAttempted: totalQuestions,
                    questionsSolved: s.correctCount[winner]
                },
                $push : {
                    ratingHistory: {
                        $each  : [{ elo: winnerNewRating, date: new Date() }],
                        $slice : -50
                    }
                }
            }),
            User.findByIdAndUpdate(loserId, {
                $inc  : {
                    rating        : -loserDelta,
                    contestsPlayed: 1,
                    totalAttempted: totalQuestions,
                    questionsSolved: s.correctCount[loser]
                },
                $push : {
                    ratingHistory: {
                        $each  : [{ elo: loserNewRating, date: new Date() }],
                        $slice : -50
                    }
                }
            })
        ])

        io.to(roomId).emit("game:end", {
            winner,
            player1      : { userName: s.player1.userName, score: s.player1.score },
            player2      : { userName: s.player2.userName, score: s.player2.score },
            ratingChanges: { winner: winnerDelta, loser: loserDelta }
        })
    }

    // Clean up session from memory regardless of match type
    activeSessions.delete(roomId)
}
