"use client";
import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState("");
  const router = useRouter();

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        // Connect to Game Server once logged in
        socket.auth = { username: u.displayName, userId: u.uid };
        socket.connect();
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Event Listeners for Game Creation
  useEffect(() => {
    // When server says "lobby_created", move to that page
    socket.on("lobby_created", (game) => {
      router.push(`/lobby/${game.id}`);
    });

    return () => {
      socket.off("lobby_created");
    };
  }, [router]);

  // --- ACTIONS ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const createGame = () => {
    if (!user) return alert("Login first!");
    socket.emit("create_lobby", { name: user.displayName });
  };

  const joinGame = () => {
    if (!user) return alert("Login first!");
    if (!roomIdInput) return alert("Enter a Room ID");
    // We navigate there, the Lobby page will handle the actual "Join" event
    router.push(`/lobby/${roomIdInput}`);
  };

  // --- RENDER ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <h1 className="text-6xl font-bold mb-8 text-orange-500">CATAN ONLINE</h1>
        <button 
          onClick={handleLogin}
          className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center">
        <h2 className="text-2xl font-bold mb-6">Welcome, {user.displayName}</h2>
        
        <button 
          onClick={createGame}
          className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold mb-4 hover:bg-orange-700"
        >
          Create New Game
        </button>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Room ID"
            className="border p-3 rounded-lg flex-grow"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
          />
          <button 
            onClick={joinGame}
            className="bg-slate-800 text-white px-6 rounded-lg font-bold hover:bg-slate-900"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}