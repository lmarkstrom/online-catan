import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { socket } from "@/lib/sockets";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
} from "@mui/material";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState("");
  const navigate = useNavigate();

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
      navigate(`/lobby/${game.id}`);
    });

    return () => {
      socket.off("lobby_created");
    };
  }, [navigate]);

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
    navigate(`/lobby/${roomIdInput}`);
  };

  // --- RENDER ---
  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: "bold",
            color: "#ff9800",
            marginBottom: 4,
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          CATAN ONLINE
        </Typography>
        <Button
          onClick={handleLogin}
          variant="contained"
          size="large"
          sx={{
            backgroundColor: "#fff",
            color: "#1e3c72",
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          Sign in with Google
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: 3 }}>
            Welcome, {user.displayName}
          </Typography>

          <Button
            onClick={createGame}
            variant="contained"
            fullWidth
            size="large"
            sx={{
              backgroundColor: "#ff9800",
              marginBottom: 3,
              "&:hover": {
                backgroundColor: "#f57c00",
              },
            }}
          >
            Create New Game
          </Button>

          <Stack direction="row" spacing={1}>
            <TextField
              placeholder="Room ID"
              variant="outlined"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              onClick={joinGame}
              variant="contained"
              sx={{
                backgroundColor: "#1e3c72",
              }}
            >
              Join
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
