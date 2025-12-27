import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { socket } from "@/lib/sockets";
import { getUserDocument } from "@/lib/db";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  Divider,
  InputAdornment,
  CircularProgress,
  IconButton,
  Tooltip
} from "@mui/material";
import { 
  Logout, 
  AddCircleOutline, 
  Login, 
  Tag 
} from "@mui/icons-material";

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Auth & Data Fetching
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigate("/");
      } else {
        setUser(u);
        const userData = await getUserDocument(u.uid);
        setDbUser(userData);
        socket.auth = { username: u.displayName || userData?.displayName, userId: u.uid };
        socket.connect();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // LISTEN FOR LOBBY CREATION 
  useEffect(() => {
    function onLobbyCreated(game) {
      navigate(`/lobby/${game.id}`);
    }

    socket.on("lobby_created", onLobbyCreated);

    return () => {
      socket.off("lobby_created", onLobbyCreated);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      socket.disconnect();
      navigate("/");
    } catch (err) { console.error(err); }
  };

  const createGame = () => {
    if (!user) return;
    const hostName = dbUser?.displayName || user.displayName || "Unknown";
    socket.emit("create_lobby", { name: hostName, uid: user.uid });
  };

  const joinGame = () => {
    if (!user || !roomIdInput) return;
    navigate(`/lobby/${roomIdInput}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: '#ea580c' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)", p: 2 }}>
      <Container maxWidth="xs">
        <Paper elevation={10} sx={{ borderRadius: 4, overflow: "hidden", position: "relative", backgroundColor: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)" }}>
          
          <Box sx={{ background: "linear-gradient(to right, #ea580c, #c2410c)", p: 4, display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>

            <Avatar
              sx={{ width: 80, height: 80, mb: 2, border: "4px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 14px rgba(0,0,0,0.2)", bgcolor: "#f57c00", fontSize: 32 }}
            >
              {dbUser?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Typography variant="h5" fontWeight="bold">
              {dbUser?.displayName || "Settler"}
            </Typography>
            
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
               Wins: {dbUser?.stats?.wins || 0} • Games: {dbUser?.stats?.gamesPlayed || 0}
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            <Button onClick={createGame} variant="contained" fullWidth size="large" startIcon={<AddCircleOutline />} sx={{ py: 2, fontSize: "1.1rem", fontWeight: "bold", borderRadius: 2, textTransform: "none", backgroundColor: "#ea580c", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)", "&:hover": { backgroundColor: "#c2410c" } }}>
              New Game
            </Button>

            <Divider sx={{ my: 4, color: "text.secondary", fontSize: "0.875rem" }}>OR JOIN EXISTING</Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField placeholder="Enter Room ID" variant="outlined" fullWidth value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><Tag sx={{ color: 'text.secondary' }} /></InputAdornment>) }} />
              <Button onClick={joinGame} variant="outlined" fullWidth size="large" startIcon={<Login />} disabled={!roomIdInput} sx={{ py: 1.5, borderRadius: 2, textTransform: "none", borderColor: "#cbd5e1", color: "#475569", fontWeight: "600", "&:hover": { borderColor: "#94a3b8", backgroundColor: "#f1f5f9" } }}>
                Join Lobby
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}