import { handleGameEnd } from "../utils/gameEnd.js"

// ─── BOT SKILL PROFILES ────────────────────────────────────────────────────────
// Each profile defines how a bot at a given Elo tier behaves:
//   accuracy  → probability (0–1) of choosing the correct answer
//   meanTime  → average seconds a bot takes to "think" per question (Gaussian mean)
//   stdDev    → spread of that thinking time (Gaussian standard deviation)
//
// Higher Elo = faster responses + higher accuracy.
// Profiles are checked in order — first match wins.

const BOT_PROFILES = [
    { maxElo: 1000,      accuracy: 0.40, meanTime: 14, stdDev: 4   },  // Beginner
    { maxElo: 1200,      accuracy: 0.55, meanTime: 10, stdDev: 3   },  // Casual
    { maxElo: 1400,      accuracy: 0.68, meanTime: 7,  stdDev: 2   },  // Intermediate
    { maxElo: 1600,      accuracy: 0.80, meanTime: 5,  stdDev: 1.5 },  // Advanced
    { maxElo: Infinity,  accuracy: 0.92, meanTime: 3,  stdDev: 1   },  // Expert
]

const getProfile = (elo) => BOT_PROFILES.find(p => elo <= p.maxElo)


// ─── BOX-MULLER GAUSSIAN SAMPLER ──────────────────────────────────────────────
// Converts two uniform random numbers into a normally distributed value.
// Why Gaussian? Flat Math.random() gives equal probability to 1s and 29s —
// that's not how humans think. A Gaussian clusters most samples around the mean
// with natural variance, making the bot indistinguishable at the network level.
//
// Formula: Z = sqrt(-2 * ln(U1)) * cos(2π * U2)  where U1, U2 ~ Uniform(0,1)
const gaussianRandom = (mean, stdDev) => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + z * stdDev
}


// ─── WRONG OPTION PICKER ──────────────────────────────────────────────────────
// When the bot is "wrong", pick any option that isn't the correct one.
// Questions have 4 options (indices 0–3).
const getWrongOption = (correctOption, totalOptions = 4) => {
    const wrongOptions = Array.from({ length: totalOptions }, (_, i) => i)
        .filter(i => i !== correctOption)
    return wrongOptions[Math.floor(Math.random() * wrongOptions.length)]
}


// ─── RUN BOT ──────────────────────────────────────────────────────────────────
// Entry point called by matchmakingWorker._handleBotMatch().
// Schedules one setTimeout per question. Each timeout fires AFTER the previous
// one's delay has accumulated — simulating a human answering sequentially.
//
// The bot reads questions directly from the session (which already stores the
// graded questions with correctOption). No extra DB call needed.

export const runBot = ({ roomId, botUserName, botElo, io, activeSessions }) => {

    const session = activeSessions.get(roomId)
    if (!session) return   // session already gone — bail silently

    const profile   = getProfile(botElo)
    const questions = session.questions  // these include correctOption (server-side only)

    // Accumulate delays so the bot answers questions one after another,
    // not all at the same time. Each question's timer fires *after* all previous delays.
    let cumulativeDelayMs = 0

    questions.forEach((question) => {

        // Sample a thinking time from the Gaussian. Clamp to minimum 1s
        // so we never get a 0ms or negative delay (Gaussian can produce negatives).
        const thinkingSeconds = Math.max(1, gaussianRandom(profile.meanTime, profile.stdDev))
        cumulativeDelayMs += thinkingSeconds * 1000

        setTimeout(() => {

            // Re-fetch the session on every timeout — it might have been deleted
            // if the real player disconnected while the bot was mid-game.
            const currentSession = activeSessions.get(roomId)
            if (!currentSession) return

            // ── DECIDE THE BOT'S ANSWER ────────────────────────────────────────
            const isCorrect    = Math.random() < profile.accuracy
            const chosenOption = isCorrect
                ? question.correctOption
                : getWrongOption(question.correctOption)

            // ── UPDATE SESSION STATE ───────────────────────────────────────────
            // Mirror the exact same scoring logic from matchMaking.js answer:submit
            // so session state stays consistent regardless of who submits.
            if (isCorrect) {
                currentSession.player2.score += 10
                currentSession.correctCount[botUserName]++
            } else {
                currentSession.player2.score -= 5
            }
            currentSession.answerCount[botUserName]++

            // Track who finishes all questions first (used for tiebreaker)
            const totalQuestions = questions.length
            if (
                currentSession.answerCount[botUserName] >= totalQuestions &&
                !currentSession.finishedFirst
            ) {
                currentSession.finishedFirst = botUserName
            }

            // ── BROADCAST LIVE SCORE UPDATE ───────────────────────────────────
            io.to(roomId).emit("score:update", {
                player1: { userName: currentSession.player1.userName, score: currentSession.player1.score },
                player2: { userName: currentSession.player2.userName, score: currentSession.player2.score },
            })

            // ── CHECK IF GAME IS OVER ──────────────────────────────────────────
            // Game ends only when BOTH players have answered every question.
            // If the real player hasn't finished yet, we wait for their last
            // answer:submit to trigger handleGameEnd from matchMaking.js instead.
            const bothFinished =
                currentSession.answerCount[currentSession.player1.userName] >= totalQuestions &&
                currentSession.answerCount[currentSession.player2.userName] >= totalQuestions

            if (bothFinished) {
                // Bot finished last — we trigger game end from here
                handleGameEnd({ session: currentSession, roomId, io, activeSessions })
            }

        }, cumulativeDelayMs)
    })
}
