import { Box } from "@mui/material";
import { socket } from "@/lib/sockets";
import { auth } from "@/lib/firebase";
import type { BuildType, GameBoardProps } from "@/util/types";

const HEX_SIZE = 60;
const HEX_COLORS: Record<string, string> = {
    wood: "#228b22", brick: "#b22222", sheep: "#7cfc00",
    wheat: "#ffd700", ore: "#708090", desert: "#f4a460"
};

const SettlementIcon = ({ x, y, color }: { x: number, y: number, color: string }) => (
    <path d={`M ${x-12} ${y} L ${x-12} ${y+10} L ${x+12} ${y+10} L ${x+12} ${y} L ${x} ${y-15} Z`} 
        fill={color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))", pointerEvents: "none" }} />
);

const CityIcon = ({ x, y, color }: { x: number, y: number, color: string }) => (
    <path d={`M ${x-15} ${y+10} L ${x+15} ${y+10} L ${x+15} ${y-5} L ${x+5} ${y-5} L ${x+5} ${y-15} L ${x-5} ${y-15} L ${x-5} ${y} L ${x-15} ${y} Z`} 
        fill={color} stroke="white" strokeWidth="2" style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))", pointerEvents: "none" }} />
);

export default function GameBoard({ game, buildType }: GameBoardProps) {
    if (!game?.board?.hexes) return null;

    const myUid = auth.currentUser?.uid;
    const isMyTurn = game.currentTurn === myUid;
    const canBuild = isMyTurn && (game.phase === "SETUP" || game.phase === "MAIN_TURN");
    const canPlaceRoad = canBuild && buildType === "road";
    const canPlaceSettlement = canBuild && buildType === "settlement";
    const canUpgradeToCity = canBuild && buildType === "city";

    const hexToPixel = (q: number, r: number) => {
        const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = HEX_SIZE * (3 / 2 * r);
        return { x, y };
    };

    // Calculate corners
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

    // Calculate Edges (Midpoint + Angle)
    const getHexEdges = (centerX: number, centerY: number) => {
        const corners = getHexCorners(centerX, centerY);
        const edges = [];
        for (let i = 0; i < 6; i++) {
            const start = corners[i];
            const end = corners[(i + 1) % 6];
            
            // Midpoint
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            
            // Angle (degrees)
            const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

            edges.push({ x: midX, y: midY, angle, id: i });
        }
        return edges;
    };

    const handleBuildClick = (e: any, hexKey: string, id: number, type: BuildType) => {
        e.stopPropagation();
        if (!canBuild) return;

        const locationSuffix = type === "road" ? `e${id}` : `${id}`;

        socket.emit("place_structure", {
            roomId: game.id,
            uid: myUid,
            type: type,
            location: `${hexKey},${locationSuffix}`
        });
    };

    return (
        <Box sx={{ width: "100%", height: "100%", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>

            <svg viewBox="-350 -300 700 600" style={{ overflow: "visible", width: "100%", height: "100%" }}>
                <filter id="shadow"><feDropShadow dx="3" dy="3" stdDeviation="3" floodOpacity="0.5" /></filter>

                {/* 1. HEXES */}
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
                                    <text y="5" textAnchor="middle" fontWeight="bold" fontSize="14" fill={['6','8'].includes(String(hex.number)) ? 'red' : 'black'}>
                                        {hex.number}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* 2. ROADS (Rendered BEFORE vertices so they look 'under' settlements) */}
                {Object.values(game.board.hexes).map((hex: any) => {
                    const { x, y } = hexToPixel(hex.q, hex.r);
                    const edges = getHexEdges(x, y);

                    return edges.map((edge) => {
                        const locKey = `${hex.id},e${edge.id}`; // Note the 'e' prefix
                        const existingBuilding = game.board.buildings?.[locKey];
                        const owner = existingBuilding ? game.players.find((p: any) => p.id === existingBuilding.owner) : null;
                        const color = owner?.color || "black";

                        return (
                            <g key={locKey}>
                                {existingBuilding && existingBuilding.type === 'road' ? (
                                    // BUILT ROAD
                                    <rect 
                                        x={edge.x - 25} y={edge.y - 4} 
                                        width="50" height="8" 
                                        fill={color} stroke="white" strokeWidth="1"
                                        transform={`rotate(${edge.angle}, ${edge.x}, ${edge.y})`}
                                        style={{ pointerEvents: "none" }}
                                    />
                                ) : (
                                    // GHOST ROAD
                                    canPlaceRoad && (
                                        <rect 
                                            x={edge.x - 25} y={edge.y - 6} 
                                            width="50" height="12" 
                                            fill="white" opacity="0"
                                            className="build-spot"
                                            transform={`rotate(${edge.angle}, ${edge.x}, ${edge.y})`}
                                            onClick={(e) => handleBuildClick(e, hex.id, edge.id, "road")}
                                            style={{ cursor: "pointer", pointerEvents: "all" }}
                                        />
                                    )
                                )}
                            </g>
                        );
                    });
                })}

                {/* 3. SETTLEMENTS (Vertices) */}
                {Object.values(game.board.hexes).map((hex: any) => {
                    const { x, y } = hexToPixel(hex.q, hex.r);
                    const corners = getHexCorners(x, y);

                    return corners.map((corner) => {
                        const locKey = `${hex.id},${corner.id}`;
                        const existingBuilding = game.board.buildings?.[locKey];
                        const owner = existingBuilding ? game.players.find((p: any) => p.id === existingBuilding.owner) : null;
                        const color = owner?.color || "black";
                        const isMyStructure = existingBuilding?.owner === myUid;

                        return (
                            <g key={locKey}>
                                {existingBuilding ? (
                                    existingBuilding.type === 'city' ? (
                                        <CityIcon x={corner.x} y={corner.y} color={color} />
                                    ) : (
                                        <>
                                            <SettlementIcon x={corner.x} y={corner.y} color={color} />
                                            {canUpgradeToCity && isMyStructure && (
                                                <circle
                                                    cx={corner.x}
                                                    cy={corner.y}
                                                    r="18"
                                                    fill="white"
                                                    opacity="0"
                                                    className="build-spot"
                                                    onClick={(e) => handleBuildClick(e, hex.id, corner.id, "city")}
                                                    style={{ cursor: "pointer", pointerEvents: "all" }}
                                                />
                                            )}
                                        </>
                                    )
                                ) : (
                                    // GHOST SETTLEMENT (Only show if buildType is 'settlement')
                                    canPlaceSettlement && (
                                        <circle 
                                            cx={corner.x} cy={corner.y} r="15" 
                                            fill="white" opacity="0" 
                                            className="build-spot"
                                            onClick={(e) => handleBuildClick(e, hex.id, corner.id, "settlement")}
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
                .build-spot:hover { opacity: 0.6 !important; fill: white; stroke: black; }
            `}</style>
        </Box>
    );
}