import { RESOURCES, NUMBER_TOKENS, HEX_COORDINATES, HEX_SIZE } from "./constants";

const shuffle = (array) => array.sort(() => Math.random() - 0.5);

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

const getEdgeWorldPoints = (q, r, edgeId) => {
  const startVertex = edgeId;
  const endVertex = (edgeId + 1) % 6;
  return {
    start: getVertexPixel(q, r, startVertex),
    end: getVertexPixel(q, r, endVertex)
  };
};

const isSameLocation = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy) < 0.1;
};

const getVertexWorldPosition = (key) => {
  const parsed = parseSettlementKey(key);
  if (!parsed) return null;
  return getVertexPixel(parsed.q, parsed.r, parsed.vertexId);
};

const getVertexDistance = (keyA, keyB) => {
  const posA = getVertexWorldPosition(keyA);
  const posB = getVertexWorldPosition(keyB);
  if (!posA || !posB) return Infinity;
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const areSameVertex = (keyA, keyB) => getVertexDistance(keyA, keyB) < 0.1;
const areAdjacentVertices = (keyA, keyB) => {
  const dist = getVertexDistance(keyA, keyB);
  return dist > 0.1 && dist < 1.05;
};

const getRoadEndpointsFromKey = (roadKey) => {
  const parsed = parseRoadKey(roadKey);
  if (!parsed) return null;
  return getEdgeWorldPoints(parsed.q, parsed.r, parsed.edgeId);
};

const roadTouchesVertex = (roadKey, vertexKey) => {
  const endpoints = getRoadEndpointsFromKey(roadKey);
  const vertexPos = getVertexWorldPosition(vertexKey);
  if (!endpoints || !vertexPos) return false;
  return isSameLocation(vertexPos, endpoints.start) || isSameLocation(vertexPos, endpoints.end);
};

const doRoadsConnect = (roadKeyA, roadKeyB) => {
  const roadA = getRoadEndpointsFromKey(roadKeyA);
  const roadB = getRoadEndpointsFromKey(roadKeyB);
  if (!roadA || !roadB) return false;
  return (
    isSameLocation(roadA.start, roadB.start) ||
    isSameLocation(roadA.start, roadB.end) ||
    isSameLocation(roadA.end, roadB.start) ||
    isSameLocation(roadA.end, roadB.end)
  );
};

const areSameRoad = (roadKeyA, roadKeyB) => {
  const roadA = getRoadEndpointsFromKey(roadKeyA);
  const roadB = getRoadEndpointsFromKey(roadKeyB);
  if (!roadA || !roadB) return false;
  const startMatches =
    isSameLocation(roadA.start, roadB.start) ||
    isSameLocation(roadA.start, roadB.end);
  const endMatches =
    isSameLocation(roadA.end, roadB.start) ||
    isSameLocation(roadA.end, roadB.end);
  return startMatches && endMatches;
};

const parseSettlementKey = (key) => {
  if (!key) return null;
  const [qStr, rStr, vertexStr] = key.split(',');
  if (vertexStr === undefined) return null;
  return {
    q: Number(qStr),
    r: Number(rStr),
    vertexId: Number(vertexStr)
  };
};

const parseRoadKey = (key) => {
  if (!key) return null;
  const [qStr, rStr, edgeToken] = key.split(',');
  if (!edgeToken || edgeToken[0] !== 'e') return null;
  return {
    q: Number(qStr),
    r: Number(rStr),
    edgeId: Number(edgeToken.slice(1))
  };
};

const isRoadConnectedToSettlement = (roadKey, settlementKey) => {
  const road = parseRoadKey(roadKey);
  const settlement = parseSettlementKey(settlementKey);
  if (!road || !settlement) {
    return false;
  }

  const settlementPos = getVertexPixel(settlement.q, settlement.r, settlement.vertexId);
  const { start, end } = getEdgeWorldPoints(road.q, road.r, road.edgeId);
  return isSameLocation(settlementPos, start) || isSameLocation(settlementPos, end);
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
  },

  isRoadConnectedToSettlement: (roadKey, settlementKey) => roadTouchesVertex(roadKey, settlementKey),
  roadTouchesVertex,
  doRoadsConnect,
  areSameVertex,
  areAdjacentVertices,
  areSameRoad
};