import { Router } from "express";
import { getLeaderBoard, getSubmissionHistory, getUserProfile } from "../controllers/leaderboard.controller.js";

const router = Router()

router.get("/leaderboard" , getLeaderBoard)
router.get("/profile/:userName" , getUserProfile)
router.get("/profile/:userName/history" , getSubmissionHistory)

export default router