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
  Button,
  Avatar,
  Badge,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress
} from "@mui/material";
import { 
  Casino, // Dice icon
  CheckCircle, 
  Home, 
  Terrain, // For Road
  Apartment, // For City
  Hexagon
} from "@mui/icons-material";
import GameBoard from "@/components/GameBoard"; // We will create this next

export default function GamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resource Colors for UI
  const resourceColors = {
    wood: "#2e7d32",   // Green
    brick: "#d84315",  // Burnt Orange
    sheep: "#66bb6a",  // Light Green
    wheat: "#fbc02d",  // Yellow
    ore: "#757575",    // Grey
  };

  useEffect(() => {
    if (!auth.currentUser) return navigate("/");
    
    if (!socket.connected) {
        socket.auth = { username: auth.currentUser.displayName, userId: auth.currentUser.uid };
        socket.connect();
    }

    // Re-join logic in case of refresh
    socket.emit("join_lobby", { roomId: id, name: auth.currentUser.displayName });

    socket.on("game_updated", (data) => {
      setGame(data);
      setLoading(false);
    });

    return () => {
      socket.off("game_updated");
    };
  }, [id, navigate]);

  // --- ACTIONS ---
  const handleRollDice = () => {
    socket.emit("roll_dice", { roomId: id });
  };

  const handleEndTurn = () => {
    socket.emit("end_turn", { roomId: id });
  };

  if (loading || !game) {
    return (
      <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#1e3a8a" }}>
        <CircularProgress sx={{ color: "white" }} />
      </Box>
    );
  }

  const isMyTurn = game.currentTurn === auth.currentUser.uid;
  const me = game.players.find(p => p.id === auth.currentUser.uid) || {};

  return (
    <Box sx={{ height: "100vh", bgcolor: "#0f172a", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      
      {/* TOP BAR: Opponents & Stats */}
      <Box sx={{ p: 2, bgcolor: "#1e293b", boxShadow: 3, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
          Room: {id}
        </Typography>

        <Stack direction="row" spacing={3}>
            {game.players.map((p) => (
                <Paper 
                    key={p.id}
                    elevation={p.id === game.currentTurn ? 10 : 1}
                    sx={{ 
                        p: 1, 
                        px: 2, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 1.5,
                        bgcolor: p.id === game.currentTurn ? "#334155" : "transparent",
                        border: p.id === game.currentTurn ? "1px solid #fbbf24" : "none",
                        color: "white"
                    }}
                >
                    <Badge badgeContent={p.vp || 0} color="warning" showZero>
                        <Avatar sx={{ bgcolor: p.color, width: 32, height: 32 }}>{p.name[0]}</Avatar>
                    </Badge>
                    <Box>
                        <Typography variant="body2" fontWeight="bold">{p.name}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Cards: {p.handSize || 0}</Typography>
                    </Box>
                </Paper>
            ))}
        </Stack>
      </Box>

      {/* MAIN AREA: The Board */}
      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* Background Water Texture */}
        <Box sx={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(#3b82f6 2px, transparent 2px)", backgroundSize: "30px 30px" }} />
        
        {/* The Actual Hex Grid */}
        <GameBoard game={game} />
      </Box>

      {/* BOTTOM BAR: Controls & Resources */}
      <Paper sx={{ p: 2, bgcolor: "#1e293b", borderTop: "1px solid #334155" }}>
        <Container maxWidth="xl">
            <Grid container spacing={2} alignItems="center">
                
                {/* LEFT: My Resources */}
                <Grid item xs={12} md={5}>
                    <Stack direction="row" spacing={1} justifyContent={{ xs: "center", md: "flex-start" }}>
                        {Object.keys(resourceColors).map((res) => (
                            <Paper key={res} sx={{ 
                                p: 1, width: 60, textAlign: "center", 
                                bgcolor: resourceColors[res], color: "white" 
                            }}>
                                <Typography variant="h6" fontWeight="bold">{me.resources?.[res] || 0}</Typography>
                                <Typography variant="caption" sx={{ textTransform: "capitalize" }}>{res}</Typography>
                            </Paper>
                        ))}
                    </Stack>
                </Grid>

                {/* CENTER: Dice & Turn Info */}
                <Grid item xs={12} md={2} sx={{ textAlign: "center" }}>
                    {game.diceResult && (
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 1 }}>
                            <Paper sx={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20 }}>
                                {game.diceResult[0]}
                            </Paper>
                            <Paper sx={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20 }}>
                                {game.diceResult[1]}
                            </Paper>
                        </Box>
                    )}
                    <Typography variant="body2" sx={{ color: "white", opacity: 0.7 }}>
                        {isMyTurn ? "IT'S YOUR TURN" : `Waiting for ${game.players.find(p => p.id === game.currentTurn)?.name}...`}
                    </Typography>
                </Grid>

                {/* RIGHT: Actions */}
                <Grid item xs={12} md={5}>
                    <Stack direction="row" spacing={2} justifyContent={{ xs: "center", md: "flex-end" }}>
                        <Tooltip title="Build Road (1 Wood, 1 Brick)">
                            <IconButton sx={{ bgcolor: "white", "&:hover": { bgcolor: "#e2e8f0" } }}>
                                <Terrain color="primary" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Build Settlement (1 Wood, 1 Brick, 1 Wheat, 1 Sheep)">
                            <IconButton sx={{ bgcolor: "white", "&:hover": { bgcolor: "#e2e8f0" } }}>
                                <Home color="primary" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Build City (2 Wheat, 3 Ore)">
                            <IconButton sx={{ bgcolor: "white", "&:hover": { bgcolor: "#e2e8f0" } }}>
                                <Apartment color="primary" />
                            </IconButton>
                        </Tooltip>
                        
                        <Box sx={{ width: 1, height: 40, bgcolor: "#475569" }} /> {/* Separator */}

                        <Button 
                            variant="contained" 
                            color="warning" 
                            startIcon={<Casino />}
                            disabled={!isMyTurn || game.phase !== "ROLL_DICE"}
                            onClick={handleRollDice}
                        >
                            Roll
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            endIcon={<CheckCircle />}
                            disabled={!isMyTurn}
                            onClick={handleEndTurn}
                        >
                            End Turn
                        </Button>
                    </Stack>
                </Grid>

            </Grid>
        </Container>
      </Paper>
    </Box>
  );
}