import mongoose ,{Schema} from "mongoose";

const battleResultSchema = new Schema({
    player1 : {
        userId : {type : Schema.Types.ObjectId , ref : "User"},
        userName : { type : String },
        score : { type : Number }
    },
    player2 : {
        userId : {type : Schema.Types.ObjectId , ref : "User"},
        userName : { type : String },
        score : { type : Number }
    },
    winner : {
        type : String
    },
    roomId : {
        type : String
    },
    isBot : {
        type    : Boolean,
        default : false
    }
} , {timestamps : true })

export const BattleResult = mongoose.model( "BattleResult" , battleResultSchema)

