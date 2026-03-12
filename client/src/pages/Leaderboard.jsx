import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/axios"

export default function Leaderboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [players, setPlayers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get("/leaderboard")
                setPlayers(res.data.data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    const getRankStyle = (rank) => {
        if (rank === 1) return "text-yellow-400 font-bold"
        if (rank === 2) return "text-gray-300 font-bold"
        if (rank === 3) return "text-amber-600 font-bold"
        return "text-gray-500"
    }

    const getRankIcon = (rank) => {
        if (rank === 1) return "🥇"
        if (rank === 2) return "🥈"
        if (rank === 3) return "🥉"
        return rank
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Leaderboard</h1>
                    <p className="text-gray-400 text-sm">Top 50 players by rating</p>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-gray-400 hover:text-white text-sm transition"
                >
                    ← Back
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    {/* Top 3 */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {players.slice(0, 3).map((player, idx) => (
                            <div
                                key={player._id}
                                className={`bg-gray-900 border rounded-2xl p-4 text-center ${idx === 0 ? "border-yellow-500/50" : idx === 1 ? "border-gray-500/50" : "border-amber-700/50"}`}
                            >
                                <div className="text-3xl mb-2">{getRankIcon(idx + 1)}</div>
                                <p className={`font-semibold truncate ${player.userName === user?.userName ? "text-blue-400" : "text-white"}`}>
                                    @{player.userName}
                                </p>
                                <p className="text-2xl font-bold mt-1">{player.rating}</p>
                                <p className="text-gray-500 text-xs mt-1">{player.contestsPlayed} contests</p>
                            </div>
                        ))}
                    </div>

                    {/* Rest of the list */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Rank</th>
                                    <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Player</th>
                                    <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Rating</th>
                                    <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Won</th>
                                    <th className="text-right text-gray-400 text-sm font-medium px-6 py-4">Played</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player, idx) => (
                                    <tr
                                        key={player._id}
                                        className={`border-b border-gray-800/50 transition ${player.userName === user?.userName ? "bg-blue-500/5" : "hover:bg-gray-800/50"}`}
                                    >
                                        <td className={`px-6 py-4 text-sm ${getRankStyle(idx + 1)}`}>
                                            {getRankIcon(idx + 1)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${player.userName === user?.userName ? "text-blue-400" : "text-white"}`}>
                                                @{player.userName}
                                                {player.userName === user?.userName && (
                                                    <span className="ml-2 text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">you</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white">{player.rating}</td>
                                        <td className="px-6 py-4 text-right text-gray-400">{player.contestsWon}</td>
                                        <td className="px-6 py-4 text-right text-gray-400">{player.contestsPlayed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}