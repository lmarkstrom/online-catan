import { useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";
import type { SelectChangeEvent } from "@mui/material";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { 
  Casino, 
  Terrain, 
  Home, 
  Apartment, 
  SkipNext,
  Style,
  ShoppingBag
} from "@mui/icons-material";
import { resourceColors } from "@/util/constants";
import type { Props, BuildType, DevCard } from "@/util/types";

type HudProps = Props & {
  buildType: BuildType;
  onChangeBuildType: (type: BuildType) => void;
};

export default function Hud(props: HudProps) {
  const { id } = useParams();
  const { game, buildType, onChangeBuildType } = props;
  const resourceKeys = Object.keys(resourceColors);
  const [resourceChoice, setResourceChoice] = useState<string>(resourceKeys[0] || "wood");
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [pendingCard, setPendingCard] = useState<DevCard | null>(null);

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

  const isMyTurn = game.currentTurn === auth.currentUser?.uid;
  const canBuild = isMyTurn && (game.phase === "SETUP" || game.phase === "MAIN_TURN");
  const me = game.players.find((p: any) => p.id === auth.currentUser?.uid) || {};
  const myCards: DevCard[] = me.devCards || [];
  const deckRemaining: number = game.devCardDeck?.length ?? 0;
  const devCardCost = { sheep: 1, wheat: 1, ore: 1 };
  const hasDevCardResources = Object.entries(devCardCost).every(
    ([res, amount]) => (me.resources?.[res] || 0) >= amount
  );
  const canBuyDevCard = isMyTurn && game.phase === "MAIN_TURN" && deckRemaining > 0 && hasDevCardResources;
  const canPlayDevCard = isMyTurn && game.phase !== "SETUP";
  const currentTurnPlayer = game.players.find((p: any) => p.id === game.currentTurn);
  const buildOptions: Array<{ type: BuildType; label: string; icon: JSX.Element; activeColor: string; hoverBg: string }> = [
    { type: "road", label: "Build Road", icon: <Terrain />, activeColor: "#38bdf8", hoverBg: "rgba(56, 189, 248, 0.15)" },
    { type: "settlement", label: "Build Settlement", icon: <Home />, activeColor: "#4ade80", hoverBg: "rgba(74, 222, 128, 0.15)" },
    { type: "city", label: "Build City", icon: <Apartment />, activeColor: "#facc15", hoverBg: "rgba(250, 204, 21, 0.15)" },
  ];

  const handleSelectBuild = (type: BuildType) => {
    if (!canBuild) return;
    onChangeBuildType(type);
  };

  const handleBuyCard = () => {
    if (!canBuyDevCard) return;
    socket.emit("buy_dev_card", {
      roomId: id,
      uid: auth.currentUser?.uid
    });
  };

  const emitPlayCard = (card: DevCard, payload?: Record<string, any>) => {
    socket.emit("play_dev_card", {
      roomId: id,
      uid: auth.currentUser?.uid,
      cardId: card.id,
      payload
    });
  };

  const handlePlayCard = (card: DevCard) => {
    if (!canPlayDevCard) return;
    if (card.key === "resource") {
      setPendingCard(card);
      setResourceDialogOpen(true);
      return;
    }
    emitPlayCard(card);
  };

  const closeResourceDialog = () => {
    setResourceDialogOpen(false);
    setPendingCard(null);
  };

  const handleConfirmResourceCard = () => {
    if (!pendingCard) return;
    emitPlayCard(pendingCard, { resource: resourceChoice });
    closeResourceDialog();
  };

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
              {resourceKeys.map((res) => (
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
                {buildOptions.map((option) => {
                  const isSelected = buildType === option.type;
                  return (
                    <Tooltip key={option.type} title={option.label}>
                      <span>
                        <IconButton
                          aria-pressed={isSelected}
                          disabled={!canBuild}
                          onClick={() => handleSelectBuild(option.type)}
                          sx={{
                            color: isSelected ? option.activeColor : "#94a3b8",
                            bgcolor: isSelected ? option.hoverBg : "transparent",
                            transition: "all 0.2s",
                            "&:hover": {
                              color: option.activeColor,
                              bgcolor: option.hoverBg,
                            },
                            opacity: canBuild ? 1 : 0.4,
                          }}
                        >
                          {option.icon}
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })}
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
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            sx={{ mt: 4 }}
          >
            <Paper
              sx={{
                flex: 1,
                p: 2,
                bgcolor: "rgba(255,255,255,0.04)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Style fontSize="small" sx={{ color: "#fcd34d" }} />
                <Typography variant="subtitle2" sx={{ letterSpacing: 1, color: "rgba(255,255,255,0.8)" }}>
                  DEVELOPMENT DECK
                </Typography>
              </Stack>
              <Typography variant="h3" sx={{ color: "white", fontWeight: 800 }}>
                {deckRemaining}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 2 }}>
                {deckRemaining === 1 ? "card remaining" : "cards remaining"}
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ShoppingBag />}
                onClick={handleBuyCard}
                disabled={!canBuyDevCard}
                sx={{ fontWeight: 700 }}
              >
                Buy Card
              </Button>
              <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(255,255,255,0.6)" }}>
                Cost: Sheep + Wheat + Ore
              </Typography>
            </Paper>

            <Paper
              sx={{
                flex: 2,
                p: 2,
                bgcolor: "rgba(255,255,255,0.04)",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Style fontSize="small" sx={{ color: "#38bdf8" }} />
                <Typography variant="subtitle2" sx={{ letterSpacing: 1, color: "rgba(255,255,255,0.8)" }}>
                  YOUR CARDS
                </Typography>
              </Stack>
              {myCards.length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                  {myCards.map((card) => (
                    <Tooltip key={card.id} title={canPlayDevCard ? "Play card" : "Wait for your turn"}>
                      <span>
                        <Chip
                          icon={<Style />}
                          label={card.label}
                          color="primary"
                          onClick={() => handlePlayCard(card)}
                          disabled={!canPlayDevCard}
                          sx={{ color: "white", fontWeight: 600 }}
                        />
                      </span>
                    </Tooltip>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.6)" }}>
                  You have no development cards yet.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Container>
      </Paper>

      <Dialog open={resourceDialogOpen} onClose={closeResourceDialog} fullWidth maxWidth="xs">
        <DialogTitle>Choose a resource</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="resource-select-label">Resource</InputLabel>
            <Select
              labelId="resource-select-label"
              value={resourceChoice}
              label="Resource"
              onChange={(event: SelectChangeEvent<string>) => setResourceChoice(event.target.value as string)}
            >
              {resourceKeys.map((res) => (
                <MenuItem key={res} value={res}>
                  {res.charAt(0).toUpperCase() + res.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResourceDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmResourceCard} disabled={!pendingCard}>
            Gain Resource
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}