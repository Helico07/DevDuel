import app from "./app.js"
import 'dotenv/config'
import connectDB from "./db/db.js"
import { Server } from "socket.io"
import { createServer } from "http"
import { matchMaking } from "./socket/matchMaking.js"
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
    httpServer.listen(PORT , ()=>{
        console.log(`Server is running at port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!" , err)
})