import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/axios"

export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await api.post("/users/logout")
        logout()
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold text-blue-400">QuizBattle</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">@{user?.userName}</span>
                    <button
                        onClick={handleLogout}
                        className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                    { label: "Rating", value: user?.rating || 1000 },
                    { label: "Contests Played", value: user?.contestsPlayed || 0 },
                    { label: "Contests Won", value: user?.contestsWon || 0 },
                    { label: "Questions Solved", value: user?.questionsSolved || 0 },
                ].map(stat => (
                    <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                    onClick={() => navigate("/solo")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-2xl text-xl transition"
                >
                    Solo Quiz
                    <p className="text-sm font-normal text-blue-200 mt-1">Practice on your own</p>
                </button>
                <button
                    onClick={() => navigate("/battle")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 rounded-2xl text-xl transition"
                >
                    1v1 Battle
                    <p className="text-sm font-normal text-purple-200 mt-1">Challenge a random opponent</p>
                </button>
            </div>

            {/* Leaderboard Link */}
            <div className="text-center mt-10">
                <button
                    onClick={() => navigate("/leaderboard")}
                    className="text-gray-400 hover:text-white text-sm underline transition"
                >
                    View Leaderboard
                </button>
            </div>
        </div>
    )
}