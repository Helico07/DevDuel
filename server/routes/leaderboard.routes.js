import { Router } from "express";
import { getLeaderBoard, getSubmissionHistory, getUserProfile, getCategoryStats } from "../controllers/leaderboard.controller.js";

const router = Router()

router.get("/leaderboard"                    , getLeaderBoard)
router.get("/profile/:userName"              , getUserProfile)
router.get("/profile/:userName/history"      , getSubmissionHistory)
router.get("/profile/:userName/stats"        , getCategoryStats)

export default router