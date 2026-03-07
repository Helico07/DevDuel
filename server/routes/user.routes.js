import { Router } from "express";
import { changePassword, deleteUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { limiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router()

router.post("/register" , limiter , registerUser)
router.post("/login" , limiter , loginUser)

// Secured routes 

router.post("/logout" , verifyJWT , logoutUser)
router.post("/change-password" , verifyJWT , changePassword)
router.delete("/delete-account" , verifyJWT , deleteUser)


export default router