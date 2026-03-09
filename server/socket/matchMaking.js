import { Question } from "../models/question.model.js"

let waitingQueue = []
let activeSessions = new Map()

const matchMaking = (io , socket)=>{

    socket.on("queue:join" , async({userName})=>{

        if(waitingQueue.length > 0){

            const opponent = waitingQueue.shift()

            const roomId = `${userName}--vs--${opponent.userName}`

            socket.join(roomId)
            opponent.socket.join(roomId)

            const questions = await Question.aggregate([
                {$sample : {size : 10}},
                {$project : {correctOption : 0 , __v : 0 , createdAt : 0 , updatedAt : 0}}
            ])

            activeSessions.set( roomId , {
                player1 : {userName : opponent.userName , socketId : opponent.socket.id , score : 0},
                player2 :  {userName : userName , socketId : socket.id , score : 0},
                questions ,
                answers : {}
            })

            io.to(roomId).emit("game:start" , {roomId , questions ,  message : "Match found!"})

        }
        else{

            waitingQueue.push({userName , socket})

            socket.emit("queue:waiting" , {message : "Waiting for opponent..."})
        }

    })
}

export {matchMaking,
        activeSessions
        }
