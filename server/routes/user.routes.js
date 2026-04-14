import { Router } from "express";
import { changePassword, deleteUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rateLimiter.middleware.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router()

router.post("/register" , limiter , registerUser)
router.post("/login" , limiter , loginUser)

// Secured routes 

router.post("/logout" , verifyJWT , logoutUser)
router.post("/change-password" , verifyJWT , changePassword)
router.delete("/delete-account" , verifyJWT , deleteUser)

// route for react-query 

router.get("/me" , verifyJWT , asyncHandler(async(req,res)=>{
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    return res.json(new ApiResponse(200 , user , "User fetched successfully"))
}))

export default router