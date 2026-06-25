import  Redis  from "ioredis"

const client  = new Redis( process.env.REDIS_URL , {
    // tell ioredis not to spam reconnect attempts if it fails
    maxRetriesPerRequest : null,
    enableReadyCheck : false,
})

client.on("error"  , (err) => console.error("Redis error:", err.message))
client.on("connect", ()    => console.log("Redis connected ✓"))

export default client