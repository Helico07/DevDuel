import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors"

import userRouter from "./routes/user.routes.js"
import quizRouter from "./routes/quiz.routes.js"
import leaderBoardRouter from "./routes/leaderboard.routes.js"
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express()

app.use(express.urlencoded({limit : "16kb" , extended : true}));
app.use(express.json({limit : "16kb"}))
app.use(cookieParser())
app.use(express.static("public"))

app.use(cors({
    origin :  process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials : true
}))

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/quiz" , quizRouter)
app.use("/api/v1" , leaderBoardRouter)

app.use(errorHandler);

export default app

