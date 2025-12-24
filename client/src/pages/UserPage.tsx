import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { socket } from "@/lib/sockets";
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
  SportsEsports, 
  Tag 
} from "@mui/icons-material";

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate("/");
      } else {
        setUser(u);
        socket.auth = { username: u.displayName, userId: u.uid };
        socket.connect();
        
        if (window.location.pathname === "/") {
          navigate("/", { replace: true });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. Event Listeners for Game Creation
  useEffect(() => {
    socket.on("lobby_created", (game) => {
      navigate(`/lobby/${game.id}`);
    });

    return () => {
      socket.off("lobby_created");
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const createGame = () => {
    if (!user) return;
    socket.emit("create_lobby", { name: user.displayName });
  };

  const joinGame = () => {
    if (!user || !roomIdInput) return;
    navigate(`/lobby/${roomIdInput}`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
        }}
      >
        <CircularProgress sx={{ color: '#ea580c' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Subtle warm gradient suitable for a Catan theme
        background: "linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: "linear-gradient(to right, #ea580c, #c2410c)", // Orange/Red Header
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "white",
            }}
          >
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>

            <Avatar
              src={user?.photoURL}
              alt={user?.displayName}
              sx={{
                width: 80,
                height: 80,
                mb: 2,
                border: "4px solid rgba(255,255,255,0.3)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
              }}
            />
            <Typography variant="h5" fontWeight="bold">
              {user?.displayName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Ready to settle?
            </Typography>
          </Box>

          {/* Action Body */}
          <Box sx={{ p: 4 }}>
            {/* Create Game Block */}
            <Button
              onClick={createGame}
              variant="contained"
              fullWidth
              size="large"
              startIcon={<AddCircleOutline />}
              sx={{
                py: 2,
                fontSize: "1.1rem",
                fontWeight: "bold",
                borderRadius: 2,
                textTransform: "none",
                backgroundColor: "#ea580c", // Strong Orange
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
                "&:hover": {
                  backgroundColor: "#c2410c",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s",
              }}
            >
              New Game
            </Button>

            <Divider sx={{ my: 4, color: "text.secondary", fontSize: "0.875rem" }}>
              OR JOIN EXISTING
            </Divider>

            {/* Join Game Block */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                placeholder="Enter Room ID"
                variant="outlined"
                fullWidth
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Tag sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    "& fieldset": { borderColor: "#e2e8f0" },
                    "&:hover fieldset": { borderColor: "#cbd5e1" },
                    "&.Mui-focused fieldset": { borderColor: "#ea580c" },
                  },
                }}
              />
              
              <Button
                onClick={joinGame}
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<Login />}
                disabled={!roomIdInput}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  fontWeight: "600",
                  "&:hover": {
                    borderColor: "#94a3b8",
                    backgroundColor: "#f1f5f9",
                  },
                }}
              >
                Join Lobby
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Footer Text */}
        <Typography 
          variant="caption" 
          align="center" 
          display="block" 
          sx={{ mt: 3, color: "text.secondary", opacity: 0.7 }}
        >
          <SportsEsports sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
          Catan Online v1.0
        </Typography>
      </Container>
    </Box>
  );
}