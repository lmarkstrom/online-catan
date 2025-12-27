import { useParams } from "react-router-dom";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Fab,
  Chip,
  Fade,
} from "@mui/material";
import { 
  Casino, 
  CheckCircle, 
  Terrain, 
  Home, 
  Apartment, 
  SkipNext
} from "@mui/icons-material";
import { resourceColors } from "@/util/constants";
import type { Props } from "@/util/types";

export default function Hud(props: Props) {
  const { id } = useParams();
  const { game } = props;

  const handleRollDice = () => {
    socket.emit("roll_dice", { 
        roomId: id,
        uid: auth.currentUser?.uid 
    });
  };

  const handleEndTurn = () => {
    socket.emit("end_turn", { 
        roomId: id,
        uid: auth.currentUser?.uid 
    });
  };
  // --- FIX END ---

  const isMyTurn = game.currentTurn === auth.currentUser?.uid;
  const me = game.players.find((p: any) => p.id === auth.currentUser?.uid) || {};
  const currentTurnPlayer = game.players.find((p: any) => p.id === game.currentTurn);

  return (
    <Box sx={{ position: "relative", zIndex: 10 }}>
      <Paper
        elevation={24}
        sx={{
          borderRadius: "24px 24px 0 0",
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          pb: 3,
          pt: 2,
          px: 2,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="center"
            justifyContent="space-between"
          >
            {/* LEFT: RESOURCE CARDS */}
            <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", py: 1 }}>
              {Object.keys(resourceColors).map((res) => (
                <Tooltip key={res} title={res.charAt(0).toUpperCase() + res.slice(1)}>
                  <Paper
                    elevation={4}
                    sx={{
                      width: 55,
                      height: 75,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: resourceColors[res],
                      color: "white",
                      borderRadius: 2,
                      position: "relative",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateY(-5px)" },
                      border: "2px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Typography variant="h5" fontWeight="900" sx={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                      {me.resources?.[res] || 0}
                    </Typography>
                  </Paper>
                </Tooltip>
              ))}
            </Stack>

            {/* CENTER: GAME STATUS & DICE */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Chip
                label={isMyTurn ? "IT'S YOUR TURN" : `${currentTurnPlayer?.name || "Opponent"}'s Turn`}
                color={isMyTurn ? "success" : "default"}
                variant={isMyTurn ? "filled" : "outlined"}
                sx={{ 
                    fontWeight: "bold", 
                    borderColor: "rgba(255,255,255,0.3)", 
                    color: "white",
                    animation: isMyTurn ? "pulse 2s infinite" : "none",
                    "@keyframes pulse": {
                        "0%": { boxShadow: "0 0 0 0 rgba(102, 187, 106, 0.4)" },
                        "70%": { boxShadow: "0 0 0 10px rgba(102, 187, 106, 0)" },
                        "100%": { boxShadow: "0 0 0 0 rgba(102, 187, 106, 0)" }
                    }
                }}
              />

              {game.diceResult && (
                <Stack direction="row" spacing={2}>
                  {[0, 1].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: "#f8fafc",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: "bold",
                        color: "#334155",
                        boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3)",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      {game.diceResult[i]}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* RIGHT: CONTROLS DOCK */}
            <Stack direction="row" spacing={3} alignItems="center">
              <Paper 
                sx={{ 
                    bgcolor: "rgba(255,255,255,0.05)", 
                    p: 1, 
                    borderRadius: 3, 
                    display: "flex", 
                    gap: 1 
                }}
              >
                <Tooltip title="Build Road">
                  <IconButton sx={{ color: "#94a3b8", "&:hover": { color: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.1)" } }}>
                    <Terrain />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Build Settlement">
                  <IconButton sx={{ color: "#94a3b8", "&:hover": { color: "#4ade80", bgcolor: "rgba(74, 222, 128, 0.1)" } }}>
                    <Home />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Build City">
                  <IconButton sx={{ color: "#94a3b8", "&:hover": { color: "#facc15", bgcolor: "rgba(250, 204, 21, 0.1)" } }}>
                    <Apartment />
                  </IconButton>
                </Tooltip>
              </Paper>

              <Stack direction="row" spacing={2}>
                <Fade in={isMyTurn && game.phase === "ROLL_DICE"}>
                    <Fab 
                        variant="extended" 
                        color="warning" 
                        onClick={handleRollDice}
                        disabled={!isMyTurn || game.phase !== "ROLL_DICE"}
                        sx={{ fontWeight: "bold", px: 3 }}
                    >
                        <Casino sx={{ mr: 1 }} /> Roll
                    </Fab>
                </Fade>

                <Fab 
                    variant="extended" 
                    color="error" 
                    onClick={handleEndTurn}
                    disabled={!isMyTurn}
                    sx={{ fontWeight: "bold", px: 3, opacity: isMyTurn ? 1 : 0.5 }}
                >
                    <SkipNext sx={{ mr: 1 }} /> End
                </Fab>
              </Stack>
            </Stack>

          </Stack>
        </Container>
      </Paper>
    </Box>
  );
}