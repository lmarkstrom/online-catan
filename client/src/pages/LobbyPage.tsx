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
import { ContentCopy, EmojiEvents } from "@mui/icons-material";

export default function LobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return navigate("/");
    
    if (!socket.connected) {
        socket.auth = { 
            username: auth.currentUser.displayName, 
            userId: auth.currentUser.uid 
        };
        socket.connect();
    }
      
    // Join Room
    socket.emit("join_lobby", { 
        roomId: id, 
        name: auth.currentUser.displayName,
        uid: auth.currentUser.uid
    });

    // Listen for Updates
    socket.on("game_updated", (gameState) => {
        setGame(gameState);
      if (gameState.status === 'PLAYING') {
        navigate(`/game/${gameState.id}`);
      }
      setLoading(false);
      setError("");
    });

    socket.on("error", (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => {
      socket.off("game_updated");
      socket.off("error");
    };
  }, [id, navigate]);
    
  const handleStartGame = () => {
        socket.emit("start_game", { roomId: id, uid: auth.currentUser.uid } );
    };

  const copyRoomId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="sm" sx={{ mt: 10 }}><Alert severity="error">{error}</Alert><Button onClick={() => navigate("/user")}>Back</Button></Container>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", p: 4 }}>
      <Container maxWidth="lg">
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1e293b' }}>
                Lobby: {id}
            </Typography>
            <Button variant="outlined" startIcon={<ContentCopy />} onClick={copyRoomId}>
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
                                    display: 'flex', alignItems: 'center', p: 1.5, 
                                    bgcolor: player.id === auth.currentUser?.uid ? '#eff6ff' : 'transparent',
                                    borderRadius: 1
                                }}
                            >
                                <Avatar sx={{ bgcolor: player.color, mr: 2 }}>
                                    {(player.name || "?").charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {player.name || "Unknown"} {player.id === auth.currentUser?.uid && "(You)"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {player.ready ? "Ready" : "Not Ready"}
                                    </Typography>
                                </Box>
                                {player.id === game.hostId && <EmojiEvents sx={{ color: '#fbbf24' }} />}
                            </Box>
                        ))}
                    </Box>

                    {/* MOVED THIS BLOCK OUTSIDE THE LOOP */}
                    <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
                        {game.hostId === auth.currentUser?.uid ? (
                            <Button 
                                variant="contained" 
                                color="success" 
                                fullWidth
                                size="large"
                                onClick={handleStartGame}
                                sx={{ fontWeight: 'bold' }}
                            >
                                Start Game
                            </Button>
                        ) : (
                            <Typography align="center" variant="body2" color="text.secondary">
                                Waiting for host to start...
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Grid>

            {/* RIGHT COLUMN: GAME AREA */}
            <Grid item xs={12} md={8}>
                <Paper elevation={3} sx={{ p: 0, borderRadius: 2, height: '500px', bgcolor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white' }}>
                    <Typography variant="h4" sx={{ opacity: 0.5 }}>Game Board Area</Typography>
                    <Box sx={{ mt: 4 }}><Chip label={`Status: ${game.status}`} color="default" /></Box>
                </Paper>
            </Grid>
        </Grid>

        {/* DEBUG */}
        <Box sx={{ mt: 5 }}>
            <Typography variant="caption">DEBUG VIEW:</Typography>
            <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#00ff00', overflowX: 'auto' }}>
                <pre>{JSON.stringify(game, null, 2)}</pre>
            </Paper>
        </Box>

      </Container>
    </Box>
  );
}