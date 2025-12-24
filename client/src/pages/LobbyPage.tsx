import { useEffect, useState } from "react";
import { socket } from "@/lib/sockets";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "@/lib/firebase";
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Person, Star } from "@mui/icons-material";

export default function LobbyPage() {
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id: roomId } = useParams();

  useEffect(() => {
    // 1. Ensure Socket is Connected (in case of page refresh)
    if (!socket.connected) {
      socket.connect();
    }

    // 2. Join the Room logic
    const user = auth.currentUser;
    if (user && roomId) {
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
    alert("Start Game logic goes here! (Next Step)");
  };

  if (error) {
    return (
      <Container maxWidth="md" sx={{ padding: 4 }}>
        <Alert severity="error">Error: {error}</Alert>
      </Container>
    );
  }

  if (!game) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ padding: 4 }}>
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: "bold", marginBottom: 1 }}>
          Lobby: <Typography component="span" sx={{ color: "#ff9800" }}>{roomId}</Typography>
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Share this Code with friends to play.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", flex: 1 }}>
            Players ({game.players.length}/4)
          </Typography>
          <Chip label={`${game.players.length}/4`} color="primary" />
        </Box>

        <List>
          {game.players.map((player, index) => (
            <ListItem
              key={player.id}
              sx={{
                backgroundColor: index % 2 === 0 ? "#f5f5f5" : "transparent",
                borderRadius: 1,
                marginBottom: 1,
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: player.color || "#999",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={player.name}
                secondary={
                  <Chip
                    label="Ready"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ marginTop: 0.5 }}
                  />
                }
              />
              {player.id === game.players[0].id && (
                <Chip icon={<Star />} label="Host" variant="filled" color="warning" />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      <Button
        onClick={startGame}
        disabled={game.players.length < 2}
        variant="contained"
        fullWidth
        size="large"
        sx={{
          backgroundColor: game.players.length < 2 ? "#ccc" : "#4caf50",
          padding: 2,
          fontSize: "1.1rem",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: game.players.length < 2 ? "#ccc" : "#388e3c",
          },
        }}
      >
        {game.players.length < 2 ? "Waiting for players..." : "START GAME"}
      </Button>
    </Container>
  );
}
