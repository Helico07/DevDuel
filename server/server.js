import app from "./app.js"
import 'dotenv/config'
import connectDB from "./db/db.js"
import { Server } from "socket.io"
import { createServer } from "http"
const PORT = process.env.PORT || 8000
import { Question } from "./models/question.model.js"


const httpsServer = createServer(app)

const io = new Server( httpsServer , {
    cors : {
        origin : process.env.CORS_ORIGIN,
        credentials : true
    }
})


connectDB()
.then(()=>{

    httpsServer.listen(PORT , ()=>{
        console.log(`Server is running at port ${PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!" , err)
})


export{io}


