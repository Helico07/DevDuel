import { getAll, dequeue, removeBySocketId } from "../redis/queue.js"
import { activeSessions }                    from "../socket/matchMaking.js"
import { Question }                          from "../models/question.model.js"
import { runBot }                            from "../bot/botEngine.js"

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 1000   // heartbeat fires every 1 second

// Expanding ring thresholds (milliseconds)
// Age 0–4s   → strict window  ±50  Elo  (fair, skill-matched game)
// Age 5–9s   → relaxed window ±150 Elo  (acceptable mismatch, avoids long wait)
// Age 10s+   → bot fallback            (guaranteed match, no wait)
const STRICT_ELO_WINDOW  = 50
const RELAXED_ELO_WINDOW = 150
const STRICT_AGE_LIMIT   = 4000   // ms
const RELAXED_AGE_LIMIT  = 9000   // ms


// ─── ELO WINDOW CALCULATOR ───────────────────────────────────────────────────
// Pure function: given how long a ticket has been waiting, return the
// acceptable Elo gap. Returns null to signal bot fallback.
const getEloWindow = (ageMs) => {
    if (ageMs <= STRICT_AGE_LIMIT)  return STRICT_ELO_WINDOW
    if (ageMs <= RELAXED_AGE_LIMIT) return RELAXED_ELO_WINDOW
    return null  // ticket has waited too long → bot fallback
}


// ─── QUESTION FETCHER ─────────────────────────────────────────────────────────
// Fetches two sets of questions from MongoDB:
//   - questionsForPlayers → safe payload (no correctOption, sent to frontend)
//   - questionsForGrading → correctOption included (stored server-side only)
// This is the same aggregation from your original matchMaking.js, extracted
// into a helper so both real matches and bot matches can share it.
const fetchQuestions = async () => {
    const questionsForPlayers = await Question.aggregate([
        { $sample  : { size: 10 } },
        { $project : { correctOption: 0, __v: 0, createdAt: 0, updatedAt: 0 } }
    ])

    const questionsForGrading = await Question.find({
        _id: { $in: questionsForPlayers.map(q => q._id) }
    }).select("correctOption")

    return { questionsForPlayers, questionsForGrading }
}


// ─── THE WORKER OBJECT ────────────────────────────────────────────────────────
// Singleton pattern — only one instance of this worker should ever exist.
// Started once at server boot via matchmakingWorker.start(io).
// All internal methods are prefixed with _ to signal they are private.

const matchmakingWorker = {

    io        : null,   // Socket.io server instance, set when start() is called
    isRunning : false,  // guard: prevents start() from spawning multiple loops   


    // ── PUBLIC API ────────────────────────────────────────────────────────────

    start(io) {
        // Guard: if the server restarts or start() is accidentally called twice,
        // we don't want two parallel heartbeat loops running simultaneously.
        if (this.isRunning) {
            console.warn("Matchmaking worker is already running — ignoring duplicate start()")
            return
        }

        this.io        = io
        this.isRunning = true
        console.log("Matchmaking worker started ✓")

        // Kick off the first tick. Each tick schedules the next one when done.
        this._tick()
    },


    // ── HEARTBEAT LOOP ────────────────────────────────────────────────────────

    _tick() {
        // We use recursive setTimeout instead of setInterval.
        // Reason: setInterval fires on a fixed clock regardless of whether the
        // previous tick finished. If processTick() takes >1s (slow DB / Redis),
        // setInterval would overlap executions. setTimeout re-schedules AFTER
        // the current tick completes → no overlapping ticks, no race conditions.
        setTimeout(async () => {
            try {
                await this._processTick()
            } catch (err) {
                // Never let a single bad tick kill the loop.
                // Log the error and let the finally block re-schedule normally.
                console.error("Matchmaking worker tick error:", err.message)
            } finally {
                // Always re-schedule, even on error. The worker must never stop.
                this._tick()
            }
        }, TICK_INTERVAL_MS)
    },


    // ── CORE MATCHING LOGIC ───────────────────────────────────────────────────

    async _processTick() {
        const tickets = await getAll()  // fetch all waiting players from Redis
        if (tickets.length === 0) return // queue empty, nothing to do this tick

        const now       = Date.now()
        const matchedIds = new Set() // tracks which ticketIds we've already paired
                                     // this tick, so we don't double-match anyone

        for (const ticket of tickets) {

            // Skip if this ticket was already matched earlier in this same tick
            if (matchedIds.has(ticket.ticketId)) continue

            const ageMs     = now - ticket.enqueuedAt
            const eloWindow = getEloWindow(ageMs)

            // ── BOT FALLBACK ──────────────────────────────────────────────────
            // Ticket waited 10+ seconds with no real match → give them a bot
            if (eloWindow === null) {
                matchedIds.add(ticket.ticketId)
                await this._handleBotMatch(ticket)
                continue
            }

            // ── REAL MATCH SEARCH ─────────────────────────────────────────────
            // Scan remaining tickets for someone within the current Elo window.
            // Conditions for a valid opponent:
            //   1. Not the same ticket
            //   2. Not already matched this tick
            //   3. Elo difference within the current window
            const opponent = tickets.find(t =>
                t.ticketId !== ticket.ticketId   &&
                !matchedIds.has(t.ticketId)      &&
                Math.abs(t.elo - ticket.elo) <= eloWindow
            )

            if (opponent) {
                matchedIds.add(ticket.ticketId)
                matchedIds.add(opponent.ticketId)
                await this._handleMatch(ticket, opponent)
            }
            // If no opponent found, we do nothing — the ticket stays in Redis
            // and the next tick will retry with potentially a wider window
        }
    },


    // ── REAL vs REAL MATCH HANDLER ────────────────────────────────────────────

    async _handleMatch(ticket1, ticket2) {
        // IMPORTANT: dequeue both BEFORE creating the session.
        // If we created the session first and then Redis errored on dequeue,
        // the next tick would find these tickets again and try to match them
        // a second time → duplicate sessions. Dequeue first = safe.
        await dequeue(ticket1.ticketId)
        await dequeue(ticket2.ticketId)

        const { questionsForPlayers, questionsForGrading } = await fetchQuestions()

        // roomId is the Socket.io room both players will join.
        // Used for broadcasting score:update and game:end events to both players at once.
        const roomId = `${ticket1.userName}--vs--${ticket2.userName}`

        // io.in(socketId).socketsJoin(roomId) is the SERVER-SIDE way to add
        // a socket to a room without holding a reference to the socket object.
        // This is the key difference from the old code that needed socket.join().
        // The worker only has socketIds, not socket objects — this API bridges that gap.
        this.io.in(ticket1.socketId).socketsJoin(roomId)
        this.io.in(ticket2.socketId).socketsJoin(roomId)

        // Store the session — same shape as before, with isBot flag added
        activeSessions.set(roomId, {
            player1      : { userId: ticket1.userId, userName: ticket1.userName, socketId: ticket1.socketId, score: 0 },
            player2      : { userId: ticket2.userId, userName: ticket2.userName, socketId: ticket2.socketId, score: 0 },
            questions    : questionsForGrading,
            answerCount  : { [ticket1.userName]: 0, [ticket2.userName]: 0 },
            finishedFirst: null,
            correctCount : { [ticket1.userName]: 0, [ticket2.userName]: 0 },
            isBot        : false,
        })

        // Broadcast to both players at once via the room
        this.io.to(roomId).emit("game:start", {
            roomId,
            questions: questionsForPlayers,
            message  : "Match found!"
        })

        console.log(`Match created: ${ticket1.userName} (${ticket1.elo}) vs ${ticket2.userName} (${ticket2.elo}) | Room: ${roomId}`)
    },


    // ── BOT MATCH HANDLER ─────────────────────────────────────────────────────

    async _handleBotMatch(ticket) {
        await dequeue(ticket.ticketId)  // remove real player from queue first

        const { questionsForPlayers, questionsForGrading } = await fetchQuestions()

        // Bot Elo is set to match the real player's Elo exactly
        // so the bot engine can calibrate difficulty to their level
        const botElo      = ticket.elo
        const botUserName = `Bot_${botElo}`   // e.g. "Bot_1050" — clear signal it's a bot
        const roomId      = `${ticket.userName}--vs--${botUserName}`

        // Join only the real player's socket to the room — the bot has no socket
        this.io.in(ticket.socketId).socketsJoin(roomId)

        activeSessions.set(roomId, {
            player1      : { userId: ticket.userId, userName: ticket.userName, socketId: ticket.socketId, score: 0 },
            player2      : { userId: "bot",         userName: botUserName,     socketId: null,            score: 0, elo: botElo },
            questions    : questionsForGrading,
            answerCount  : { [ticket.userName]: 0, [botUserName]: 0 },
            finishedFirst: null,
            correctCount : { [ticket.userName]: 0, [botUserName]: 0 },
            isBot        : true,   // ← dashboard and BattleResult use this flag
        })

        // Tell the real player the game is starting
        this.io.to(roomId).emit("game:start", {
            roomId,
            questions: questionsForPlayers,
            message  : "Opponent found!"
        })

        console.log(`Bot match created: ${ticket.userName} (${ticket.elo}) vs ${botUserName} | Room: ${roomId}`)

        // Bot engine fires here — schedules Gaussian-delayed answers for every question
        runBot({ roomId, botUserName, botElo, io: this.io, activeSessions })
    }
}

export default matchmakingWorker
