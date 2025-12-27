import { useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Badge,
  Stack,
} from "@mui/material";
import type { Props } from "@/util/types";

export default function Header(props : Props) {
    const { id } = useParams();
    const { game } = props;

    return (
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
    );
}