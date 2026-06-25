import 'dotenv/config'
import app from "./app.js"
import connectDB from "./db/db.js"
import { Server } from "socket.io"
import { createServer } from "http"
import { matchMaking }      from "./socket/matchMaking.js"
import matchmakingWorker   from "./workers/matchmakingWorker.js"
const PORT = process.env.PORT || 8000

const httpServer = createServer(app)

const io = new Server( httpServer , {
    cors : {
        origin : process.env.CORS_ORIGIN,
        credentials : true
    }
})

io.on("connection" , (socket)=>{
    console.log("User connected : " , socket.id)

    matchMaking( io , socket)

    socket.on("disconnect"  , ()=>{
        console.log("User Disconnected : "  , socket.id)
    })
})


connectDB()
.then(()=>{
    httpServer.listen(PORT, () => {
        console.log(`Server is running at port ${PORT}`)
        // Start the matchmaking heartbeat worker After the server is fully up.
        // Passing io so the worker can emit game:start, score:update, game:end.
        matchmakingWorker.start(io)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!" , err)
})