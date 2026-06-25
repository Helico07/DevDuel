import { User }            from "../models/user.model.js"
import { enqueue,
         removeBySocketId } from "../redis/queue.js"
import { handleGameEnd }   from "../utils/gameEnd.js"

// ─── SHARED SESSION STORE ──────────────────────────────────────────────────────
// activeSessions is the in-memory Map of all live game sessions.
// Key   → roomId (string)
// Value → session object (players, questions, scores, answerCount, etc.)
//
// Exported so the matchmaking worker can write new sessions into it,
// and botEngine.js can read + update session state directly.
let activeSessions = new Map()


// ─── MATCHMAKING SOCKET HANDLER ────────────────────────────────────────────────
// Handles three socket events per connected player:
//   1. queue:join    → enqueue the player into Redis (worker handles actual matching)
//   2. answer:submit → grade an answer and check if the game is over
//   3. disconnect    → evict ghost ticket from Redis if player was still in queue

const matchMaking = (io, socket) => {

    // ── 1. QUEUE:JOIN ──────────────────────────────────────────────────────────
    // Old behaviour: instant match attempt against waitingQueue array.
    // New behaviour: fetch the player's current Elo from DB, build a ticket,
    // push it into Redis Sorted Set, and wait for the heartbeat worker to match.
    //
    // Why fetch Elo from DB here instead of trusting client-sent data?
    // The client cannot be trusted with its own rating — a player could send
    // a fake high Elo to get matched against weaker opponents. Always read
    // authoritative values from the database.
    socket.on("queue:join", async ({ userId, userName }) => {
        try {
            const user = await User.findById(userId).select("rating")
            if (!user) return socket.emit("queue:error", { message: "User not found" })

            await enqueue({
                userId,
                userName,
                socketId: socket.id,
                elo     : user.rating,
            })

            socket.emit("queue:waiting", { message: "Searching for an opponent..." })

        } catch (err) {
            console.error("queue:join error:", err.message)
            socket.emit("queue:error", { message: "Failed to join queue. Please try again." })
        }
    })


    // ── 2. ANSWER:SUBMIT ───────────────────────────────────────────────────────
    // Grades a submitted answer, updates session scores, and checks if both
    // players have finished all questions.
    // This handler is called for BOTH real vs real AND real vs bot matches.
    // (The bot's own answers are handled inside botEngine.js, not here.)
    socket.on("answer:submit", async ({ roomId, questionId, chosenOption, userName }) => {

        const session = activeSessions.get(roomId)
        if (!session) return  // session not found (already ended, or invalid roomId)

        const question = session.questions.find(q => String(q._id) === String(questionId))
        if (!question) return  // unknown questionId — ignore (possible replay attack)

        const isCorrect = question.correctOption == chosenOption

        // Update score and correctCount for the submitting player
        if (session.player1.userName === userName) {
            session.player1.score += isCorrect ? 10 : -5
            if (isCorrect) session.correctCount[session.player1.userName]++
            session.answerCount[userName]++

        } else if (session.player2.userName === userName) {
            session.player2.score += isCorrect ? 10 : -5
            if (isCorrect) session.correctCount[session.player2.userName]++
            session.answerCount[userName]++

        } else {
            return  // userName doesn't belong to this session — ignore
        }

        const totalQuestions = session.questions.length

        // Record who answered all questions first — used as tiebreaker if scores are equal
        if (session.answerCount[userName] >= totalQuestions && !session.finishedFirst) {
            session.finishedFirst = userName
        }

        // Broadcast live score update to both players in the room
        io.to(roomId).emit("score:update", {
            player1: { userName: session.player1.userName, score: session.player1.score },
            player2: { userName: session.player2.userName, score: session.player2.score }
        })

        // Game ends only when BOTH players have answered every question.
        // For bot matches: if the bot hasn't finished yet, this will be false
        // and the bot engine's own setTimeout will trigger handleGameEnd instead.
        const bothFinished =
            session.answerCount[session.player1.userName] >= totalQuestions &&
            session.answerCount[session.player2.userName] >= totalQuestions

        if (bothFinished) {
            // Real player finished last (or both finished simultaneously) → end game
            await handleGameEnd({ session, roomId, io, activeSessions })
        }
    })


    // ── 3. DISCONNECT ──────────────────────────────────────────────────────────
    // Ghost ticket killer — if a player disconnects while waiting in the queue,
    // their ticket must be removed from Redis immediately.
    //
    // Without this: the heartbeat worker sees their ticket, finds a match,
    // emits game:start to a dead socket → the real opponent stares at a spinner forever.
    socket.on("disconnect", async () => {
        try {
            await removeBySocketId(socket.id)
        } catch (err) {
            console.error("disconnect cleanup error:", err.message)
        }
    })
}


export { matchMaking, activeSessions }
