import { Box } from "@mui/material";

// Standard Catan Layout (q, r coordinates)
const HEX_LAYOUT = [
    { q: 0, r: -2, id: 1, type: "ore", num: 10 },
    { q: 1, r: -2, id: 2, type: "sheep", num: 2 },
    { q: 2, r: -2, id: 3, type: "wood", num: 9 },
    { q: -1, r: -1, id: 4, type: "wheat", num: 12 },
    { q: 0, r: -1, id: 5, type: "brick", num: 6 },
    { q: 1, r: -1, id: 6, type: "sheep", num: 4 },
    { q: 2, r: -1, id: 7, type: "brick", num: 10 },
    { q: -2, r: 0, id: 8, type: "wheat", num: 9 },
    { q: -1, r: 0, id: 9, type: "wood", num: 11 },
    { q: 0, r: 0, id: 10, type: "DESERT", num: null },
    { q: 1, r: 0, id: 11, type: "wood", num: 3 },
    { q: 2, r: 0, id: 12, type: "ore", num: 8 },
    { q: -2, r: 1, id: 13, type: "wood", num: 8 },
    { q: -1, r: 1, id: 14, type: "ore", num: 3 },
    { q: 0, r: 1, id: 15, type: "wheat", num: 4 },
    { q: 1, r: 1, id: 16, type: "sheep", num: 5 },
    { q: -2, r: 2, id: 17, type: "brick", num: 5 },
    { q: -1, r: 2, id: 18, type: "wheat", num: 6 },
    { q: 0, r: 2, id: 19, type: "sheep", num: 11 },
];

const HEX_COLORS = {
    wood: "#228b22",
    brick: "#b22222",
    sheep: "#7cfc00",
    wheat: "#ffd700",
    ore: "#708090",
    DESERT: "#f4a460"
};

export default function GameBoard({ game }) {
    // Hexagon Math
    const size = 60;
    const hexWidth = Math.sqrt(3) * size;
    const hexHeight = 2 * size;

    // Convert axial (q, r) to pixels (x, y)
    const hexToPixel = (q, r) => {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = size * (3 / 2 * r);
        return { x, y };
    };

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transform: "scale(0.8)",
            }}
        >
            <svg 
                viewBox="-300 -300 600 600" 
                style={{ overflow: "visible", width: "100%", height: "100%" }}
            >
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="3" dy="3" stdDeviation="3" floodOpacity="0.5" />
                </filter>

                {/* Render Hexagons */}
                {HEX_LAYOUT.map((hex) => {
                    const { x, y } = hexToPixel(hex.q, hex.r);
                    return (
                        <g key={hex.id} transform={`translate(${x}, ${y})`}>
                            {/* Hex Shape */}
                            <polygon
                                points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
                                fill={HEX_COLORS[hex.type]}
                                stroke="#fefefe"
                                strokeWidth="4"
                                filter="url(#shadow)"
                            />
                            
                            {/* Number Token */}
                            {hex.num && (
                                <g>
                                    <circle r="18" fill="white" opacity="0.9" />
                                    <text
                                        y="5"
                                        textAnchor="middle"
                                        fontSize="14"
                                        fontWeight="bold"
                                        fill={hex.num === 6 || hex.num === 8 ? "red" : "black"}
                                    >
                                        {hex.num}
                                    </text>
                                    {/* Probability dots */}
                                    <text y="14" textAnchor="middle" fontSize="8">
                                        {".".repeat(6 - Math.abs(7 - hex.num))}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </Box>
    );
}