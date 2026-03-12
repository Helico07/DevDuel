import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { io } from "socket.io-client"
import api from "../utils/axios"

export default function Battle() {
    const navigate = useNavigate()
    const { user, login } = useAuth()
    const socketRef = useRef(null)

    const [screen, setScreen] = useState("waiting")
    const [questions, setQuestions] = useState([])
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState(null)
    const [roomId, setRoomId] = useState(null)
    const [scores, setScores] = useState({ player1: { userName: "", score: 0 }, player2: { userName: "", score: 0 } })
    const [result, setResult] = useState(null)
    const [timeLeft, setTimeLeft] = useState(90)

    useEffect(() => {
        const socket = io("http://localhost:8000", { withCredentials: true })
        socketRef.current = socket

        socket.emit("queue:join", { userId: user._id, userName: user.userName })

        socket.on("queue:waiting", () => setScreen("waiting"))

        socket.on("game:start", ({ roomId, questions }) => {
            setRoomId(roomId)
            setQuestions(questions)
            setScreen("playing")
        })

        socket.on("score:update", ({ player1, player2 }) => {
            setScores({ player1, player2 })
        })

        socket.on("game:end", async (data) => {
            setResult(data)
            const userRes = await api.get(`/profile/${user.userName}`)
            login(userRes.data.data)
            setScreen("result")
        })

        return () => socket.disconnect()
    }, [])

    useEffect(() => {
        if (screen !== "playing") return

        setTimeLeft(90)
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [screen])

    const handleAnswer = (idx) => setSelected(idx)

    const handleNext = () => {
        if (selected === null) return

        socketRef.current.emit("answer:submit", {
            roomId,
            questionId: questions[current]._id,
            chosenOption: selected,
            userName: user.userName
        })

        setSelected(null)
        if (current + 1 < questions.length) {
            setCurrent(current + 1)
        }
    }

    const myScore = scores.player1.userName === user.userName ? scores.player1.score : scores.player2.score
    const opponentScore = scores.player1.userName === user.userName ? scores.player2.score : scores.player1.score
    const opponentName = scores.player1.userName === user.userName ? scores.player2.userName : scores.player1.userName

    if (screen === "waiting") return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-2">Finding opponent...</h2>
                <p className="text-gray-400 mb-8">Waiting for someone to join the queue</p>
                <button
                    onClick={() => { socketRef.current?.disconnect(); navigate("/dashboard") }}
                    className="text-gray-400 hover:text-white text-sm underline"
                >
                    Cancel
                </button>
            </div>
        </div>
    )

    if (screen === "playing") return (
        <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col items-center justify-center">
            {/* Score Bar */}
            <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex justify-between items-center">
                <div className="text-center">
                    <p className="text-sm text-gray-400">You</p>
                    <p className="text-2xl font-bold text-blue-400">{myScore}</p>
                    <p className="text-xs text-gray-500">@{user.userName}</p>
                </div>
                <div className="text-center">
                    <span className={`text-sm font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-gray-400"}`}>
                        ⏱ {timeLeft}s
                    </span>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-400">Opponent</p>
                    <p className="text-2xl font-bold text-purple-400">{opponentScore}</p>
                    <p className="text-xs text-gray-500">@{opponentName || "..."}</p>
                </div>
            </div>

            {/* Question */}
            <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 text-sm">Question {current + 1} of {questions.length}</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-purple-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <h2 className="text-lg font-semibold mb-6">{questions[current]?.title}</h2>

                <div className="space-y-3 mb-8">
                    {questions[current]?.options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition ${selected === idx ? "border-purple-500 bg-purple-500/10 text-white" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    disabled={selected === null}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                    {current + 1 === questions.length ? "Submit Last Answer" : "Next"}
                </button>
            </div>
        </div>
    )

    if (screen === "result") return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
                <div className="text-5xl mb-4">{result?.winner === user.userName ? "🏆" : "😔"}</div>
                <h1 className="text-3xl font-bold mb-2">
                    {result?.winner === user.userName ? "You Won!" : "You Lost!"}
                </h1>
                <p className="text-gray-400 mb-8">Winner: @{result?.winner}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Your Score</p>
                        <p className="text-2xl font-bold text-blue-400">
                            {result?.player1.userName === user.userName ? result?.player1.score : result?.player2.score}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-1">Opponent Score</p>
                        <p className="text-2xl font-bold text-purple-400">
                            {result?.player1.userName === user.userName ? result?.player2.score : result?.player1.score}
                        </p>
                    </div>
                </div>

                <div className={`text-sm mb-8 p-3 rounded-lg ${result?.winner === user.userName ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    Rating {result?.winner === user.userName ? "+10" : "-10"}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setScreen("waiting"); setCurrent(0); setSelected(null); setQuestions([]) }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg transition"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg transition"
                    >
                        Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}