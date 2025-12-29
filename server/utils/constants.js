const RESOURCE_TYPES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
const BUILD_COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 }
};

const DEVELOPMENT_CARD_CONFIG = [
  {
    key: 'knight',
    label: 'Knight',
    count: 14,
    handler: 'knight',
    description: 'Move the robber and steal a resource from another player.'
  },
  {
    key: 'victoryPoint',
    label: 'Victory Point',
    count: 5,
    handler: 'victoryPoint',
    description: 'Grants 1 victory point.'
  },
  {
    key: 'resource',
    label: 'Resource Boost',
    count: 2,
    handler: 'resource',
    description: 'Gain 2 resources of your choice.'
  },
  {
    key: 'roadBuilding',
    label: 'Road Building',
    count: 2,
    handler: 'roadBuilding',
    description: 'Build 2 roads for free.'
  }
];

const DEVELOPMENT_CARD_COST = { sheep: 1, wheat: 1, ore: 1 };

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

const HEX_SIZE = 1.0; 

export {
    RESOURCE_TYPES,
    BUILD_COSTS,
    DEVELOPMENT_CARD_CONFIG,
    DEVELOPMENT_CARD_COST
    , RESOURCES,
    NUMBER_TOKENS,
    HEX_COORDINATES,
    HEX_SIZE
};