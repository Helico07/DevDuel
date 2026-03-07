import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";



const getLeaderBoard = asyncHandler(async (req,res,next)=>{

    // i have to get some information of the top 50 players 
    // sort by rating then select 50 using limit

    let userInfo = await User.find()
                  .sort({rating : -1})
                  .limit(50)
                  .select("userName contestsPlayed rating contestsWon questionsSolved")

    // will return an array in which there will be user objects having this information . For indexing array will have . Will handle rest in frontend

    return res
    .status(200)
    .json(new ApiResponse(200 , userInfo , "Data for leaderBoard fetched successfully"))
})

const getSubmissionHistory = asyncHandler(async (req , res, next) => {

    // User id needed

    const userName = req.params.userName;

    // Find its id , i need that to find its submissions

    const user = await User.findOne({userName}).select("_id")

    if(!user){
        throw new ApiError(404 , "User not found")
    }
    // now bring his last 10 submissions

    const submissions = await Submission.find({userId : user._id})
                        .sort({createdAt : -1})
                        .limit(10)
                        .select("category score correctAnswers wrongAnswers totalQuestions createdAt")


    return res
    .status(200)
    .json( new ApiResponse( 200 , submissions , "Users submissions History fetched successfully" ) )
})


const getUserProfile = asyncHandler(async(req,res,next)=>{

    const userName = req.params.userName
    const user = await User.findOne({userName}).select("-password -email -refreshToken")

    if(!user){
        throw new ApiError(404 , "User not found")
    }

    let accuracy = 0;
    if(user.totalAttempted > 0){
        accuracy = (user.questionsSolved / user.totalAttempted)  * 100
    }

    const userObj = user.toObject()
    userObj.accuracy = parseFloat(accuracy.toFixed(1))

    return res
           .status(200)
           .json( new ApiResponse(200 , userObj , "User profile details fetched successfully" )) 
})


export {getLeaderBoard,
        getSubmissionHistory,
        getUserProfile
    }