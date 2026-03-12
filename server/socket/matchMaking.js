import { BattleResult } from "../models/battleResult.model.js"
import {User} from '../models/user.model.js'
import { Question } from "../models/question.model.js"

let waitingQueue = []
let activeSessions = new Map()

const matchMaking = (io , socket)=>{

    socket.on("queue:join" , async({userId , userName})=>{

        if(waitingQueue.length > 0){

            const opponent = waitingQueue.shift()

            const roomId = `${userName}--vs--${opponent.userName}`

            socket.join(roomId)
            opponent.socket.join(roomId)

            const questionsForPlayers = await Question.aggregate([
                {$sample : {size : 10}},
                {$project : {correctOption : 0 , __v : 0 , createdAt : 0 , updatedAt : 0}}
            ])

            const questionsForGrading = await Question.find({
                _id : { $in : questionsForPlayers.map(q => q._id )}
            }).select("correctOption")

            activeSessions.set( roomId , {
                player1 : {userId : opponent.userId , userName : opponent.userName , socketId : opponent.socket.id , score : 0},
                player2 :  {userId , userName : userName , socketId : socket.id , score : 0},
                questions : questionsForGrading ,
                answerCount : { [opponent.userName] : 0 , [userName] : 0},
                finishedFirst : null,
                correctCount : { [opponent.userName] : 0 , [userName] : 0}
                // answers : {}                   Will use later when build a review feature
            })

            io.to(roomId).emit("game:start" , {roomId , questions : questionsForPlayers ,  message : "Match found!"})

        }
        else{

            waitingQueue.push({userId ,userName , socket})

            socket.emit("queue:waiting" , {message : "Waiting for opponent..."})
        }

    })

    socket.on("answer:submit" , async ({roomId , questionId , chosenOption , userName})=>{

        const session = activeSessions.get(roomId)
        if(!session) return

        const question = session.questions.find( q => String(q._id) === String(questionId))
        if(!question) return

        // finding if the question is answered correctly or not 
        let correct =  (question.correctOption == chosenOption) 

        if(session.player1.userName == userName){
            if(correct){
                session.player1.score += 10
                session.correctCount[session.player1.userName]++;
            }
            else{
                session.player1.score -= 5
            }
            session.answerCount[userName]++;
        }
        else if (session.player2.userName == userName){
            if(correct){
                session.player2.score += 10
                session.correctCount[session.player2.userName]++;
            }
            else{
                session.player2.score -= 5
            }
            session.answerCount[userName]++;
        }
        else{
            return;
        }
        const totalQuestions = session.questions.length

        if(session.answerCount[userName] >= totalQuestions && !session.finishedFirst){
                session.finishedFirst = userName
        }

        io.to(roomId).emit("score:update" , {
            player1 : { userName : session.player1.userName , score : session.player1.score },
            player2 : { userName : session.player2.userName , score : session.player2.score }
        })

        const bothFinished = session.answerCount[session.player1.userName] >= totalQuestions && session.answerCount[session.player2.userName] >= totalQuestions

        if(bothFinished){

            const s = session

            let winner
            let loser
            
            if(s.player1.score == s.player2.score){
                winner = s.finishedFirst
                loser = s.player1.userName == winner ? s.player2.userName : s.player1.userName
            }
            else if(s.player1.score > s.player2.score){
                winner = s.player1.userName
                loser = s.player2.userName
            }
            else{
                winner = s.player2.userName
                loser = s.player1.userName
            }

            
            await BattleResult.create({
                player1 : { userId : s.player1.userId , userName : s.player1.userName , score : s.player1.score },
                player2 : { userId : s.player2.userId , userName : s.player2.userName , score : s.player2.score },
                winner ,
                roomId
            })

            const winnerId = s.player1.userName == winner ? s.player1.userId : s.player2.userId
            const looserId = s.player1.userName == winner ? s.player2.userId : s.player1.userId

            await User.findByIdAndUpdate( winnerId , { $inc : {rating : 10 , contestsPlayed : 1 , contestsWon : 1 ,
                                             totalAttempted : totalQuestions , questionsSolved : s.correctCount[winner]}
                                        })
            await User.findByIdAndUpdate( looserId , { $inc : {rating : -10 , contestsPlayed : 1 , totalAttempted : totalQuestions ,
                                            questionsSolved : s.correctCount[loser]
                                        }})
            
            io.to(roomId).emit("game:end" , {
                winner ,
                player1 : { userName : s.player1.userName ,  score : s.player1.score},
                player2 : { userName : s.player2.userName ,  score : s.player2.score },
                ratingChanges : 10
            }) 
            
            activeSessions.delete(roomId)
        }
    })
}

export {matchMaking,
        activeSessions
        }
