const RESOURCES = [
  'wood', 'wood', 'wood', 'wood',
  'brick', 'brick', 'brick',
  'sheep', 'sheep', 'sheep', 'sheep',
  'wheat', 'wheat', 'wheat', 'wheat',
  'ore', 'ore', 'ore',
  'desert'
];

const NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

const HEX_COORDINATES = [
    { q: 0, r: -2 }, { q: 1, r: -2 }, { q: 2, r: -2 },
    { q: -1, r: -1 }, { q: 0, r: -1 }, { q: 1, r: -1 }, { q: 2, r: -1 },
    { q: -2, r: 0 }, { q: -1, r: 0 }, { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
    { q: -2, r: 1 }, { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 },
    { q: -2, r: 2 }, { q: -1, r: 2 }, { q: 0, r: 2 }
];

const shuffle = (array) => array.sort(() => Math.random() - 0.5);

// --- GEOMETRY HELPERS ---
const HEX_SIZE = 1.0; 

const hexToPixel = (q, r) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = HEX_SIZE * (3 / 2 * r);
    return { x, y };
};

const getVertexPixel = (q, r, vertexId) => {
    const center = hexToPixel(q, r);
    const angle_deg = 60 * vertexId - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: center.x + HEX_SIZE * Math.cos(angle_rad),
        y: center.y + HEX_SIZE * Math.sin(angle_rad)
    };
};

const isSameLocation = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy) < 0.1;
};

module.exports = {
  generateBoard: () => {
    const resources = shuffle([...RESOURCES]);
    const numbers = shuffle([...NUMBER_TOKENS]);
    const hexes = {};

    HEX_COORDINATES.forEach((coord, index) => {
      const resource = resources[index];
      const number = resource === 'desert' ? null : numbers.pop();
      const key = `${coord.q},${coord.r}`;
      hexes[key] = { q: coord.q, r: coord.r, resource, number, id: key };
    });

    return { hexes, buildings: {} };
  },

  doesBuildingTouchHex: (hex, buildingKey) => {
    const [bQ, bR, bV] = buildingKey.split(',').map(Number);
    const buildingPos = getVertexPixel(bQ, bR, bV);

    for (let i = 0; i < 6; i++) {
        const hexCornerPos = getVertexPixel(hex.q, hex.r, i);
        if (isSameLocation(buildingPos, hexCornerPos)) {
            return true;
        }
    }
    return false;
  }
};