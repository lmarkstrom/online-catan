import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Alert
} from "@mui/material";
import { ContentCopy, EmojiEvents, SportsEsports } from "@mui/icons-material";

export default function LobbyPage() {
  const { id } = useParams(); // Get Room ID from URL
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Connection Safety Check
    if (!auth.currentUser) {
        navigate("/");
        return;
    }
    
    if (!socket.connected) {
        socket.auth = { 
            username: auth.currentUser.displayName, 
            userId: auth.currentUser.uid 
        };
        socket.connect();
    }
      
    socket.on("game_updated", (gameState) => {
        setGame(gameState);
        
        // ADD THIS:
        if (gameState.status === "PLAYING") {
            navigate(`/game/${gameState.id}`);
        }
    });

    // Emit Join Event
    // We emit this every time we load the page to ensure we are subscribed to the room updates
    socket.emit("join_lobby", { 
        roomId: id, 
        name: auth.currentUser.displayName 
    });

    // Socket Listeners
    socket.on("game_updated", (gameState) => {
      setGame(gameState);

      // *** ADD THIS BLOCK ***
      if (gameState.status === 'PLAYING') {
        navigate(`/game/${gameState.id}`);
      }
      // **********************
      
      setLoading(false);
      setError("");
    });

    socket.on("error", (err) => {
      setError(err.message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      socket.off("game_updated");
      socket.off("error");
    };
  }, [id, navigate]);
    
  const handleStartGame = () => {
        socket.emit("start_game", { roomId: id });
    };

  const copyRoomId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RENDER STATES ---

  if (loading) {
    return (
      <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => navigate("/user")}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", p: 4 }}>
      <Container maxWidth="lg">
        
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1e293b' }}>
                <SportsEsports sx={{ mr: 2, verticalAlign: 'bottom' }} />
                Lobby: {id}
            </Typography>
            <Button 
                variant="outlined" 
                startIcon={<ContentCopy />} 
                onClick={copyRoomId}
            >
                {copied ? "Copied!" : "Copy Room ID"}
            </Button>
        </Box>

        <Grid container spacing={4}>
            {/* LEFT COLUMN: PLAYER LIST */}
            <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Players ({game.players.length}/4)
                    </Typography>
                          <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {game.players.map((player) => (
                            <Box 
                                key={player.id} 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    p: 1.5, 
                                    bgcolor: player.id === auth.currentUser?.uid ? '#eff6ff' : 'transparent',
                                    borderRadius: 1
                                }}
                            >
                                <Avatar sx={{ bgcolor: player.color, mr: 2 }}>
                                    {/* Fallback to "?" if name is missing */}
                                    {(player.name || "?").charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {/* Fallback to "Unknown Player" */}
                                        {player.name || "Unknown Player"} {player.id === auth.currentUser?.uid && "(You)"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {player.ready ? "Ready" : "Not Ready"}
                                    </Typography>
                                </Box>
                                {player.id === game.hostId && (
                                    <EmojiEvents sx={{ color: '#fbbf24' }} />
                                )}
                                {game.hostId === auth.currentUser?.uid ? (
                                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                                        <Button 
                                        variant="contained" 
                                        color="success" 
                                        size="large"
                                        onClick={handleStartGame}
                                        sx={{ 
                                            py: 2, 
                                            px: 6, 
                                            fontSize: '1.2rem', 
                                            fontWeight: 'bold',
                                            boxShadow: '0 4px 14px rgba(0,0,0,0.2)' 
                                        }}
                                        >
                                        Start Game
                                        </Button>
                                    </Box>
                                    ) : (
                                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                                        <Typography variant="body1" color="text.secondary">
                                        Waiting for host to start...
                                        </Typography>
                                    </Box>
                                    )}
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Grid>

            {/* RIGHT COLUMN: GAME AREA (PLACEHOLDER) */}
            <Grid item xs={12} md={8}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 0, 
                        borderRadius: 2, 
                        height: '500px', 
                        bgcolor: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexDirection: 'column'
                    }}
                >
                    <Typography variant="h4" sx={{ opacity: 0.5 }}>
                        Game Board Area
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.5 }}>
                        (Hex Grid will render here)
                    </Typography>
                    
                    <Box sx={{ mt: 4 }}>
                         <Chip label={`Status: ${game.status}`} color={game.status === 'WAITING' ? 'success' : 'default'} />
                    </Box>
                </Paper>
            </Grid>
        </Grid>

        {/* DEBUG SECTION (REMOVE LATER) */}
        <Box sx={{ mt: 5 }}>
            <Typography variant="caption" color="text.secondary">DEVELOPER DEBUG VIEW:</Typography>
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#00ff00', overflowX: 'auto' }}>
                <pre>{JSON.stringify(game, null, 2)}</pre>
            </Paper>
        </Box>

      </Container>
    </Box>
  );
}