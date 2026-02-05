import mongoose,{Schema} from "mongoose"

const questionSchema = new Schema({
    title : 
    {
        type : String,
        required : true,
        trim : true,
        maxlength : 1000
    },
    codingSnippet : 
    {
        type : String,
        trim : true
    },
    type :
    {
        type : String,
        enum : ["MCQ" , "BOOLEAN"],
        default : "MCQ"
    },
    category :
    {
        type : String,
        enum : {values : ["DBMS", "CN" ,"OOPS" , "OS" , "DSA"] , message : "{VALUE} is not a valid category"},
        required : true,
        index : true
    },
    rating : 
    {
        type : Number,
        index : true
    },
    difficulty : 
    {
        type : String,
        enum : ["Easy" , "Medium" , "Hard"],
        default : "Medium"
    },
    options : 
    {
        type : [String],     // Array of String 
        validate : {
            validator : function(v){
                return v.length >= 2           // Question should have atleast 2 options
            },
            message : "Question should include atleast 2 options"
        }
    },
    correctOption : 
    {
        type : Number,                   // correct option idx
        required : true,
        select : false                  // bina specifically mange frontend ko  nhi jayega 
    }
} , {timestamps : true})

export const Question = mongoose.model("Question" , questionSchema)