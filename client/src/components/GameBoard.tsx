import { Box } from "@mui/material";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";

const HEX_SIZE = 60;
const HEX_COLORS: Record<string, string> = {
    wood: "#228b22", brick: "#b22222", sheep: "#7cfc00",
    wheat: "#ffd700", ore: "#708090", desert: "#f4a460"
};

// Icons (Same as before)
const SettlementIcon = ({ x, y, color }: { x: number, y: number, color: string }) => (
    <path d={`M ${x-12} ${y} L ${x-12} ${y+10} L ${x+12} ${y+10} L ${x+12} ${y} L ${x} ${y-15} Z`} 
        fill={color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))" }} />
);

const CityIcon = ({ x, y, color }: { x: number, y: number, color: string }) => (
    <path d={`M ${x-15} ${y+10} L ${x+15} ${y+10} L ${x+15} ${y-5} L ${x+5} ${y-5} L ${x+5} ${y-15} L ${x-5} ${y-15} L ${x-5} ${y} L ${x-15} ${y} Z`} 
        fill={color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))" }} />
);

export default function GameBoard({ game }: { game: any }) {
    if (!game?.board?.hexes) return null;

    const myUid = auth.currentUser?.uid;
    const isMyTurn = game.currentTurn === myUid;
    
    const canBuild = isMyTurn && (game.phase === "SETUP" || game.phase === "MAIN_TURN");

    const hexToPixel = (q: number, r: number) => {
        const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = HEX_SIZE * (3 / 2 * r);
        return { x, y };
    };

    const getHexCorners = (centerX: number, centerY: number) => {
        const corners = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            corners.push({
                x: centerX + HEX_SIZE * Math.cos(angle_rad),
                y: centerY + HEX_SIZE * Math.sin(angle_rad),
                id: i
            });
        }
        return corners;
    };

    const handleVertexClick = (e: any, hexKey: string, vertexId: number) => {
        e.stopPropagation();
        if (!canBuild) return;

        socket.emit("place_structure", {
            roomId: game.id,
            uid: myUid,
            type: "settlement",
            location: `${hexKey},${vertexId}`
        });
    };

    return (
        <Box sx={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: 'transparent' }}>
            <svg viewBox="-350 -300 700 600" style={{ overflow: "visible", width: "100%", height: "100%" }}>
                <filter id="shadow"><feDropShadow dx="3" dy="3" stdDeviation="3" floodOpacity="0.5" /></filter>

                {/* HEXES */}
                {Object.values(game.board.hexes).map((hex: any) => {
                    const { x, y } = hexToPixel(hex.q, hex.r);
                    return (
                        <g key={hex.id} transform={`translate(${x}, ${y})`} style={{ pointerEvents: "none" }}>
                            <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
                                fill={HEX_COLORS[hex.resource] || "#ccc"}
                                stroke="#fff" strokeWidth="2" filter="url(#shadow)" />
                            {hex.number && (
                                <g>
                                    <circle r="18" fill="white" opacity="0.8" />
                                    <text y="5" textAnchor="middle" fontWeight="bold" fontSize="14">{hex.number}</text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* BUILD SPOTS */}
                {Object.values(game.board.hexes).map((hex: any) => {
                    const { x, y } = hexToPixel(hex.q, hex.r);
                    const corners = getHexCorners(x, y);

                    return corners.map((corner) => {
                        const locKey = `${hex.id},${corner.id}`;
                        const existingBuilding = game.board.buildings?.[locKey];
                        const owner = existingBuilding ? game.players.find((p: any) => p.id === existingBuilding.owner) : null;
                        const color = owner?.color || "black";

                        return (
                            <g key={locKey}>
                                {existingBuilding ? (
                                    existingBuilding.type === 'city' ? 
                                        <CityIcon x={corner.x} y={corner.y} color={color} /> :
                                        <SettlementIcon x={corner.x} y={corner.y} color={color} />
                                ) : (
                                    canBuild && (
                                        <circle 
                                            cx={corner.x} 
                                            cy={corner.y} 
                                            r="12" 
                                            fill="white" 
                                            opacity="0" 
                                            className="build-spot"
                                            onClick={(e) => handleVertexClick(e, hex.id, corner.id)}
                                            style={{ cursor: "pointer", pointerEvents: "all" }}
                                        />
                                    )
                                )}
                            </g>
                        );
                    });
                })}
            </svg>
            <style>{`
                .build-spot:hover { opacity: 0.5; fill: white; stroke: black; }
            `}</style>
        </Box>
    );
}