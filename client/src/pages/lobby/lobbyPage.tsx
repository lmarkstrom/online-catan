"use client";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function LobbyPage({ params }) {
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const roomId = params.id;

  useEffect(() => {
    // 1. Ensure Socket is Connected (in case of page refresh)
    if (!socket.connected) {
       // Ideally, redirect to login if not connected, or reconnect logic
       // For simplicity, we assume they came from Home
       socket.connect();
    }

    // 2. Join the Room logic
    const user = auth.currentUser;
    if (user) {
        // Emit "join_lobby" immediately when this page loads
        socket.emit("join_lobby", { roomId, name: user.displayName });
    }

    // 3. Listen for Updates
    socket.on("game_updated", (updatedGame) => {
      setGame(updatedGame);
    });

    socket.on("error", (err) => {
      setError(err.message);
    });

    return () => {
      socket.off("game_updated");
      socket.off("error");
    };
  }, [roomId]);

  const startGame = () => {
    // socket.emit("start_game", { roomId });
    alert("Start Game logic goes here! (Next Step)");
  };

  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;
  if (!game) return <div className="p-10">Loading Lobby...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Lobby: {roomId}</h1>
        <p className="text-gray-500 mb-8">Share this Code with friends to play.</p>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Players ({game.players.length}/4)</h2>
          <ul className="space-y-3">
            {game.players.map((player) => (
              <li key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full bg-${player.color}-500`}></div>
                  <span className="font-medium">{player.name}</span>
                  {player.id === game.players[0].id && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">HOST</span>}
                </div>
                <span className="text-green-600 text-sm">Ready</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Only Host can see Start Button */}
        {/* Note: In real app, check if auth.currentUser.uid === game.hostId */}
        <button 
          onClick={startGame}
          disabled={game.players.length < 2}
          className={`w-full py-4 rounded-lg font-bold text-white transition
            ${game.players.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          {game.players.length < 2 ? "Waiting for players..." : "START GAME"}
        </button>
      </div>
    </div>
  );
}