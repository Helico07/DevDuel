import mongoose,{Schema} from "mongoose"

const submissionSchema = new Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    category : {
        type : String,
        required : true,
        enum : { values : ["DBMS" , "CN" , "OOPS" , "DSA" , "OS"]}
    },
    totalQuestions : {
        type : Number,
        required : true
    },
    correctAnswers : {
        type : Number,
        required : true,
        default : 0
    },
    wrongAnswers : {
        type : Number,
        required : true,
        default : 0
    },
    score : {
        type : Number,
        required : true
    }
} , {timestamps : true})


export const Submission = mongoose.model("Submission" , submissionSchema)