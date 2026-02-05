import { Router } from "express";
import { getQuiz, submitQuiz } from "../controllers/quiz.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.get("/start" , verifyJWT , getQuiz)
router.post("/submit" , verifyJWT , submitQuiz)

export default router