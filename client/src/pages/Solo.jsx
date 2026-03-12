import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/axios"

const CATEGORIES = ["DSA", "OS", "DBMS", "CN", "OOPS"]
const DIFFICULTIES = ["Easy", "Medium", "Hard"]

export default function Solo() {
    const navigate = useNavigate()
    const { login, user } = useAuth()
    const [screen, setScreen] = useState("config")
    const [category, setCategory] = useState("DSA")
    const [difficulty, setDifficulty] = useState("Easy")
    const [questions, setQuestions] = useState([])
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState([])
    const [selected, setSelected] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(90)

    const handleAutoSubmit = async (currentAnswers) => {
        try {
            const res = await api.post("/quiz/submit", {
                category,
                answers: currentAnswers
            })
            setResult(res.data.data)
            const userRes = await api.get(`/profile/${user.userName}`)
            login(userRes.data.data)
            setScreen("result")
        } catch (err) {
            navigate("/dashboard")
        }
    }

    useEffect(() => {
        if (screen !== "playing") return

        setTimeLeft(90)
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleAutoSubmit(answers)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [screen])

    const startQuiz = async () => {
        setLoading(true)
        try {
            const res = await api.get(`/quiz/start?category=${category}&difficulty=${difficulty}&limit=10`)
            setQuestions(res.data.data.questions)
            setScreen("playing")
        } catch (err) {
            alert("Failed to fetch questions")
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (idx) => setSelected(idx)

    const handleNext = async () => {
        const newAnswers = [...answers, {
            questionId: questions[current]._id,
            chosenOption: selected
        }]
        setAnswers(newAnswers)
        setSelected(null)

        if (current + 1 < questions.length) {
            setCurrent(current + 1)
        } else {
            try {
                const res = await api.post("/quiz/submit", {
                    category,
                    answers: newAnswers
                })
                setResult(res.data.data)
                const userRes = await api.get(`/profile/${user.userName}`)
                login(userRes.data.data)
                setScreen("result")
            } catch (err) {
                alert("Submission failed")
            }
        }
    }

    if (screen === "config") return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">
                <button onClick={() => navigate("/dashboard")} className="text-gray-400 text-sm mb-6 hover:text-white">← Back</button>
                <h1 className="text-2xl font-bold mb-6">Configure Quiz</h1>

                <div className="mb-6">
                    <p className="text-gray-400 text-sm mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                onClick={() => setCategory(c)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${category === c ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-gray-400 text-sm mb-2">Difficulty</p>
                    <div className="flex gap-2">
                        {DIFFICULTIES.map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${difficulty === d ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={startQuiz}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Start Quiz"}
                </button>
            </div>
        </div>
    )

    if (screen === "playing") return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-xl">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-400 text-sm">Question {current + 1} of {questions.length}</span>
                    <span className={`text-sm font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-blue-400"}`}>
                        ⏱ {timeLeft}s
                    </span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <h2 className="text-lg font-semibold mb-6">{questions[current].title}</h2>

                <div className="space-y-3 mb-8">
                    {questions[current].options.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition ${selected === idx ? "border-blue-500 bg-blue-500/10 text-white" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    disabled={selected === null}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                    {current + 1 === questions.length ? "Submit" : "Next"}
                </button>
            </div>
        </div>
    )

    if (screen === "result") return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
                <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
                <p className="text-gray-400 mb-8">Here's how you did</p>

                <div className="text-6xl font-bold text-blue-400 mb-2">{result?.score}</div>
                <p className="text-gray-400 mb-8">Total Score</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-2xl font-bold text-green-400">{result?.correctCount}</p>
                        <p className="text-gray-400 text-sm">Correct</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <p className="text-2xl font-bold text-red-400">{result?.wrongCount}</p>
                        <p className="text-gray-400 text-sm">Wrong</p>
                    </div>
                </div>

                <div className={`text-sm mb-8 p-3 rounded-lg ${result?.ratingChange > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    Rating {result?.ratingChange > 0 ? "+" : ""}{result?.ratingChange}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => { setScreen("config"); setCurrent(0); setAnswers([]); setSelected(null) }}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg transition"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg transition"
                    >
                        Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
}