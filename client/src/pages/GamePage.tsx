import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";
import { getUserDocument } from "@/lib/db"; // <--- Import DB Fetcher
import { onAuthStateChanged } from "firebase/auth";
import { Box, CircularProgress, Typography } from "@mui/material";
import GameBoard from "@/components/GameBoard";
import Header from "@/components/game/Header";
import Hud from "@/components/game/Hud";
import type { BuildType } from "@/util/types";

export default function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [buildType, setBuildType] = useState<BuildType>("settlement");

  // 1. Wait for Auth AND Fetch DB Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const dbUser = await getUserDocument(currentUser.uid);
        const enhancedUser = {
            ...currentUser,
            displayName: dbUser?.displayName || currentUser.displayName || "Unknown"
        };
        setUser(enhancedUser);
      } else {
        navigate("/");
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Connect & Join
  useEffect(() => {
    if (authChecking || !user) return;

    if (!socket.connected) {
        socket.auth = { username: user.displayName, userId: user.uid };
        socket.connect();
    }

    socket.emit("join_lobby", { 
        roomId: id, 
        name: user.displayName, 
        uid: user.uid 
    });

    const onGameUpdate = (data: any) => {
      setGame(data);
      setLoading(false);
    };

    socket.on("game_updated", onGameUpdate);

    return () => {
      socket.off("game_updated", onGameUpdate);
    };
  }, [id, user, authChecking]);

  if (authChecking || loading || !game) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: "#1e3a8a", color: "white" }}>
        <CircularProgress color="inherit" />
        <Typography sx={{ mt: 2 }}>Loading Game...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", bgcolor: "#0f172a", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Header game={game} />
      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Box sx={{ 
              position: "absolute", 
              inset: 0, 
              opacity: 0.1, 
              backgroundImage: "radial-gradient(#3b82f6 2px, transparent 2px)", 
              backgroundSize: "30px 30px",
              pointerEvents: "none" // <--- CRITICAL ADDITION
          }} />
          <Box sx={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
              <GameBoard game={game} buildType={buildType} />
          </Box>
      </Box>
      <Hud 
        game={game} 
        buildType={buildType} 
        onChangeBuildType={(next) => setBuildType(next)} 
      />
    </Box>
  );
}