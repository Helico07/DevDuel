import client from "./client.js"


/*
    C++ analogy :-

    HSET is basically unordered_map < string ( ticket_id ) , unordered_map < string , string >> 
    Z is multimap < int ( elo ) , string ( ticketid) > 

*/


// Redis key constants — centralised so a typo never causes a silent bug
const QUEUE_KEY = "matchmaking:queue"           // Sorted Set  → score=Elo, member=ticketId
const ticketKey = (id) => `ticket:${id}`        // Hash        → all ticket fields


// ─── ENQUEUE ────────────────────────────────────────────────────────────────
// Adds a player into the matchmaking queue.
// Two Redis writes, always together:
//   1. HSET  — stores the full ticket data in a Hash
//   2. ZADD  — registers the ticketId in the Sorted Set scored by Elo
//              so ZRANGEBYSCORE can find it during the expanding-ring search
const enqueue = async ({ userId, userName, socketId, elo }) => {

    const ticketId   = crypto.randomUUID()   // built-in Node.js, no import needed
    const enqueuedAt = Date.now()            // ms timestamp — used to compute wait age

    // Store full ticket data as a Redis Hash
    // Redis Hashes only accept strings, so we stringify numbers
    await client.hset(ticketKey(ticketId), {
        ticketId,
        userId,
        userName,
        socketId,
        elo        : String(elo),
        enqueuedAt : String(enqueuedAt),
    })

    // Register in the Sorted Set with Elo as the score
    // ZADD matchmaking:queue <elo> <ticketId>
    await client.zadd(QUEUE_KEY, elo, ticketId)

    return ticketId   // caller may want this for logging
}


// ─── DEQUEUE ────────────────────────────────────────────────────────────────
// Removes a ticket after a match is made (or when bot fallback fires).
// Two Redis deletes:
//   ZREM — removes the ticketId from the Sorted Set
//   DEL  — deletes the Hash so no stale data lingers in memory
const dequeue = async (ticketId) => {
    await client.zrem(QUEUE_KEY, ticketId)
    await client.del(ticketKey(ticketId))
}


// ─── REMOVE BY SOCKET ID ────────────────────────────────────────────────────
// Ghost ticket killer — called from the socket "disconnect" event.
// Problem: on disconnect we only know socket.id, not ticketId.
// Solution: fetch all tickets, find the one with a matching socketId, then dequeue it.
// This is O(n) but n = number of people in queue at once, which is always tiny.
const removeBySocketId = async (socketId) => {
    const tickets = await getAll()

    const ghost = tickets.find(t => t.socketId === socketId)
    if (!ghost) return   // they weren't in the queue (already matched, or never queued)

    await dequeue(ghost.ticketId)
    console.log(`Ghost ticket evicted for socketId: ${socketId}`)
}


// ─── GET ALL ────────────────────────────────────────────────────────────────
// Fetches every waiting ticket with its full data.
// Used by the heartbeat worker on every tick to evaluate matches.
//
// Steps:
//   1. ZRANGE matchmaking:queue 0 -1 — get all ticketIds in Elo order
//   2. For each ticketId → HGETALL ticket:<id> — fetch the Hash
//   3. Parse string fields back to numbers (Redis stores everything as strings)
//   4. Return the assembled array
const getAll = async () => {
    // Get all ticketIds in the Sorted Set (ascending Elo order)
    const ticketIds = await client.zrange(QUEUE_KEY, 0, -1)

    if (ticketIds.length === 0) return []

    // Fetch all Hashes in parallel — much faster than sequential awaits
    const ticketDataArray = await Promise.all(
        ticketIds.map(id => client.hgetall(ticketKey(id)))
    )

    // Filter out any nulls (ticket deleted between zrange and hgetall — race edge case)
    // Then parse numeric fields back from strings
    return ticketDataArray
        .filter(Boolean)
        .map(t => ({
            ...t,
            elo        : Number(t.elo),
            enqueuedAt : Number(t.enqueuedAt),
        }))
}


export { enqueue, dequeue, removeBySocketId, getAll }