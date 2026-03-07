import { Question } from "../models/question.model.js";
import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

//  /api/v1/quiz/start?category=""&difficulty=""&limit=

const getQuiz = asyncHandler(async(req , res)=>{  
     
    // taking category , difficulty and no of questions from query parameters
    const {category , difficulty , limit} = req.query



    if(!category){
        throw new ApiError(400 , "Category is required")
    }

    let maxLimit = 15
    let safeLimit = Math.min(limit , maxLimit)
    
    const matchStage = {
        category : category.toUpperCase()
    }
    
    // if difficulty is selected by user then bring questions from that difficulty only , else dont consider difficulty as a selection criteria for questions

    // if(difficulty){
    //     matchStage.difficulty = difficulty
    // }

    // fetch questions from db

    const pipeline = [
        {
            $match : matchStage
        },
        {
            $sample : { size : parseInt(safeLimit)}
        },
        {
            $project : {
                correctOption : 0,
                createdAt : 0,
                updatedAt : 0,
                __v : 0
            }
        }
    ];

    const questions = await Question.aggregate(pipeline)
    
    // if(!questions || questions.length == 0){
    //     throw new ApiError(400 , "No questions found for this category")
    // }

    // send metaData 
    let timePerQuestion = 40
    if(difficulty === "Easy") timePerQuestion = 20
    if(difficulty === "Hard") timePerQuestion = 60

    const totalTime = timePerQuestion*questions.length

    return res
    .status(200)
    .json( new ApiResponse(200 , 
        {questions ,
        totalTime,
        config : {
            category,
            difficulty : difficulty || "Mixed",
            count : questions.length
        }},
        "quiz fetched successfully"))
})


const submitQuiz = asyncHandler(async(req,res)=>{

    const {category , answers} = req.body

    if(!category || !answers || !Array.isArray(answers)){
        throw new ApiError(400 , "Invalid submission data")
    }

    const questionIds = answers.map(a=>a.questionId)

    const validQuestions = await Question.find({
        _id : {$in : questionIds}
    }).select("correctOption")

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const correctMap = new Map()

    validQuestions.forEach(q=>{
        correctMap.set(String(q._id) , q.correctOption)
    })

    answers.forEach(ans=>{

        const correctOption = correctMap.get(ans.questionId)

        if(correctOption != undefined && ans.chosenOption == correctOption){
            score += 10;
            correctCount++;
        }
        else{
            score -= 5;
            wrongCount++;
        }

    })

    const submission = await Submission.create({
        userId : req.user._id,
        category : category,
        totalQuestions : answers.length,
        score : score,
        correctAnswers : correctCount,
        wrongAnswers : wrongCount
    });

    // ratingChanges
    const ratingChange = score > 5 ? 10 : -10
    
    await User.findByIdAndUpdate(req.user._id , {
        $inc : {rating : score > 5 ? 10 : -10 ,
                questionsSolved : correctCount,
                totalAttempted : (correctCount + wrongCount),
                contestsPlayed : 1
            }
    },{new : true});

    return res.status(200)
    .json( new ApiResponse(
        200 , 
        {score,
        correctCount,
        wrongCount,
        total : answers.length,
        submissionId : submission._id ,
        ratingChange
        }, 
        "Quiz submitted successfully"
    )
)

})

export {
    getQuiz,
    submitQuiz
}