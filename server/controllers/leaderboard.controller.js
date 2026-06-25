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


// ─── GET CATEGORY STATS ───────────────────────────────────────────────────────
// Runs a single $facet aggregation on the Submission collection.
// $facet executes multiple sub-pipelines on the SAME input documents in one
// query pass — no N separate DB calls for N categories.
//
// Each sub-pipeline ($group) computes for one category:
//   totalAttempted  → sum of all questions answered
//   totalCorrect    → sum of correct answers
//   accuracy        → (totalCorrect / totalAttempted) * 100
//
// The result is shaped into a clean { DSA: {...}, OS: {...} } map for the frontend.
const getCategoryStats = asyncHandler(async (req, res) => {

    const { userName } = req.params

    const user = await User.findOne({ userName }).select("_id")
    if (!user) throw new ApiError(404, "User not found")

    const CATEGORIES = ["DSA", "OS", "DBMS", "CN", "OOPS"]

    // Build one sub-pipeline per category inside $facet.
    // Each pipeline: filter by category → group → compute stats.
    const facetStages = {}
    CATEGORIES.forEach(cat => {
        facetStages[cat] = [
            { $match: { category: cat } },
            {
                $group: {
                    _id            : null,
                    totalAttempted : { $sum: "$totalQuestions" },
                    totalCorrect   : { $sum: "$correctAnswers" },
                }
            },
            {
                // Project accuracy as a rounded percentage.
                // $cond guards against divide-by-zero when no submissions exist.
                $project: {
                    _id           : 0,
                    totalAttempted: 1,
                    totalCorrect  : 1,
                    accuracy: {
                        $cond: [
                            { $gt: ["$totalAttempted", 0] },
                            { $round: [{ $multiply: [{ $divide: ["$totalCorrect", "$totalAttempted"] }, 100] }, 1] },
                            0
                        ]
                    }
                }
            }
        ]
    })

    // Single aggregation call — one round trip to MongoDB for all 5 categories.
    // $match first narrows to this user's submissions before $facet fans out.
    const [raw] = await Submission.aggregate([
        { $match: { userId: user._id } },
        { $facet: facetStages }
    ])

    // Flatten: each facet returns an array (possibly empty). Take [0] or default.
    const stats = {}
    CATEGORIES.forEach(cat => {
        stats[cat] = raw[cat][0] ?? { totalAttempted: 0, totalCorrect: 0, accuracy: 0 }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Category stats fetched successfully"))
})


export {
    getLeaderBoard,
    getSubmissionHistory,
    getUserProfile,
    getCategoryStats
}