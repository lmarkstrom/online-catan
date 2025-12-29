const store = require('../store/memoryStore');
const {
  generateBoard,
  doesBuildingTouchHex,
  isRoadConnectedToSettlement,
  roadTouchesVertex,
  doRoadsConnect,
  areSameVertex,
  areAdjacentVertices,
  areSameRoad
} = require('../utils/boardUtils');
const { v4: uuidv4 } = require('uuid');
import { DEVELOPMENT_CARD_CONFIG, RESOURCE_TYPES, BUILD_COSTS } from '../config/gameConfig';

const shuffleArray = (input) => {
  return [...input].sort(() => Math.random() - 0.5);
};

const buildDevelopmentDeck = () => {
  const deck = [];
  DEVELOPMENT_CARD_CONFIG.forEach((card) => {
    for (let i = 0; i < card.count; i++) {
      deck.push({ key: card.key, label: card.label, handler: card.handler, description: card.description });
    }
  });
  return shuffleArray(deck);
};

const normalizePlayerResources = (player) => {
  if (!player.resources) player.resources = {};
  RESOURCE_TYPES.forEach((res) => {
    if (typeof player.resources[res] !== 'number') {
      player.resources[res] = 0;
    }
  });
};

const hasResources = (player, cost) => {
  return Object.entries(cost).every(([res, amount]) => (player.resources[res] || 0) >= amount);
};

const deductResources = (player, cost) => {
  Object.entries(cost).forEach(([res, amount]) => {
    player.resources[res] -= amount;
  });
};

const DEVELOPMENT_CARD_HANDLERS = {
  knight: ({ game, player }) => {
    player.knightsPlayed = (player.knightsPlayed || 0) + 1;
    game.logs.push(`${player.name} played a Knight card.`);
  },
  resource: ({ game, player, payload }) => {
    const chosenResource = payload?.resource;
    if (!chosenResource || !RESOURCE_TYPES.includes(chosenResource)) {
      throw new Error('Select a valid resource to gain.');
    }
    normalizePlayerResources(player);
    player.resources[chosenResource] += 1;
    game.logs.push(`${player.name} gained 1 ${chosenResource} from a Resource card.`);
  }
};

const drawDevelopmentCard = (game) => {
  if (!game.devCardDeck || game.devCardDeck.length === 0) {
    throw new Error('No development cards remaining.');
  }
  return game.devCardDeck.pop();
};

const validateSettlementPlacement = (game, uid, location, isSetupPhase) => {
  const buildings = game.board.buildings || {};

  for (const [locKey, building] of Object.entries(buildings)) {
    if (building.type === 'road') continue;
    if (areSameVertex(locKey, location)) {
      throw new Error('Intersection already occupied.');
    }
    if (areAdjacentVertices(locKey, location)) {
      throw new Error('Settlements must be at least two edges apart.');
    }
  }

  if (!isSetupPhase) {
    const hasFriendlyRoad = Object.entries(buildings).some(([locKey, building]) =>
      building.type === 'road' && building.owner === uid && roadTouchesVertex(locKey, location)
    );

    if (!hasFriendlyRoad) {
      throw new Error('Settlements must connect to your road network.');
    }
  }
};

const validateRoadPlacement = (game, uid, location) => {
  const buildings = game.board.buildings || {};

  const duplicateRoad = Object.entries(buildings).some(([locKey, building]) =>
    building.type === 'road' && areSameRoad(locKey, location)
  );
  if (duplicateRoad) {
    throw new Error('A road already exists on that edge.');
  }

  const touchesFriendlyStructure = Object.entries(buildings).some(([locKey, building]) =>
    building.owner === uid && building.type !== 'road' && roadTouchesVertex(location, locKey)
  );

  const touchesFriendlyRoad = Object.entries(buildings).some(([locKey, building]) =>
    building.owner === uid && building.type === 'road' && doRoadsConnect(location, locKey)
  );

  if (!touchesFriendlyStructure && !touchesFriendlyRoad) {
    throw new Error('Roads must connect to your existing network.');
  }
};

const validateCityUpgrade = (game, uid, location) => {
  const existing = game.board.buildings?.[location];
  if (!existing || existing.owner !== uid || existing.type !== 'settlement') {
    throw new Error('Cities can only upgrade your own settlements.');
  }
};

const GameService = {
  createGame: (hostName, hostId) => {
    const roomId = uuidv4().slice(0, 4).toUpperCase();
    const newGame = {
      id: roomId,
      hostId: hostId,
      status: 'WAITING',
      players: [{ 
        id: hostId, name: hostName, color: 'red', ready: false, 
        resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
        devCards: [],
        knightsPlayed: 0
      }],
      board: {}, 
      devCardDeck: [],
      devCardDiscard: [],
      turnIndex: 0,
      setupTurnIndex: 0,
      logs: [`Game created by ${hostName}`]
    };
    store.saveGame(roomId, newGame);
    return newGame;
  },

  joinGame: (roomId, playerName, playerId) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Room not found");
    
    const existingPlayer = game.players.find(p => p.id === playerId);
    
    if (existingPlayer) {
        if (playerName !== "Unknown" && existingPlayer.name === "Unknown") {
            existingPlayer.name = playerName;
            store.saveGame(roomId, game);
        }
        return { game, isNew: false }; 
    }

    if (game.players.length >= 4) throw new Error("Room is full");
    
    if (game.status !== 'WAITING' && game.status !== 'PLAYING') throw new Error("Game finished");

    const colors = ['red', 'blue', 'orange', 'white'];
    const newPlayer = {
      id: playerId,
      name: playerName,
      color: colors[game.players.length],
      ready: false,
      resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
      devCards: [],
      knightsPlayed: 0
    };

    game.players.push(newPlayer);
    game.logs.push(`${playerName} joined`);
    store.saveGame(roomId, game);
    
    // Return flag saying this WAS a new join
    return { game, isNew: true };
  },

  // --- GAMEPLAY LOGIC ---

  startGame: (roomId, requesterId) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");
    if (game.hostId !== requesterId) throw new Error("Only host can start");

    game.status = 'PLAYING';
    game.board = generateBoard();
    game.devCardDeck = buildDevelopmentDeck();
    game.devCardDiscard = [];
    
    game.phase = "SETUP"; 
    game.turnOrder = game.players.map(p => p.id); // e.g., [A, B, C, D]
    game.currentTurn = game.turnOrder[0];
    game.setupTurnIndex = 0; 
    game.setupRequirement = { expect: "settlement", pendingSettlement: null };

    game.logs.push("Game Started! Setup Phase Begins.");
    store.saveGame(roomId, game);
    return game;
  },

  placeStructure: (roomId, uid, type, location) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");
    if (!game.board.buildings) {
      game.board.buildings = {};
    }

    if (game.currentTurn !== uid) throw new Error("Not your turn");
    if (game.phase === "ROLL_DICE") throw new Error("You must roll the dice first!");

    const isSetupPhase = game.phase === "SETUP";
    if (type !== "city" && game.board.buildings[location]) throw new Error("Spot occupied");
    if (isSetupPhase && type === "city") throw new Error("Cities cannot be built during setup.");

    if (isSetupPhase) {
      game.setupRequirement = game.setupRequirement || { expect: "settlement", pendingSettlement: null };
      const { expect, pendingSettlement } = game.setupRequirement;

      if (expect === "settlement" && type !== "settlement") {
        throw new Error("You must place a settlement before building a road in setup.");
      }

      if (expect === "road") {
        if (type !== "road") {
          throw new Error("You must place a road connected to your new settlement.");
        }
        if (!pendingSettlement || !isRoadConnectedToSettlement(location, pendingSettlement)) {
          throw new Error("Road must touch the settlement you just placed.");
        }
      }
    }

    const player = game.players.find((p) => p.id === uid);
    if (!player) throw new Error("Player not found in game");
    normalizePlayerResources(player);

    switch (type) {
      case "settlement":
        validateSettlementPlacement(game, uid, location, isSetupPhase);
        break;
      case "road":
        validateRoadPlacement(game, uid, location);
        break;
      case "city":
        validateCityUpgrade(game, uid, location);
        break;
      default:
        throw new Error("Unknown structure type");
    }

    if (!isSetupPhase) {
      const cost = BUILD_COSTS[type];
      if (!cost) throw new Error(`No cost configured for ${type}`);
      if (!hasResources(player, cost)) {
        throw new Error(`Not enough resources to build a ${type}.`);
      }
      deductResources(player, cost);
    }

    game.board.buildings[location] = { type, owner: uid };
    const logName = player.name || uid;
    game.logs.push(`${logName} built a ${type}`);

    if (isSetupPhase) {
      if (type === "settlement") {
        game.setupRequirement = { expect: "road", pendingSettlement: location };
        store.saveGame(roomId, game);
        return game;
      }

      if (type === "road") {
        game.setupRequirement = { expect: "settlement", pendingSettlement: null };
        store.saveGame(roomId, game);
        return GameService.endTurn(roomId, uid);
      }
    }

    store.saveGame(roomId, game);
    return game;
  },

  buyDevelopmentCard: (roomId, uid) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");
    if (game.phase !== "MAIN_TURN") {
      throw new Error("You can only buy development cards during your main turn.");
    }

    const player = game.players.find((p) => p.id === uid);
    if (!player) throw new Error("Player not found in game");
    normalizePlayerResources(player);

    if (!hasResources(player, DEVELOPMENT_CARD_COST)) {
      throw new Error("Not enough resources to buy a development card.");
    }

    const drawnTemplate = drawDevelopmentCard(game);
    const cardInstance = {
      id: uuidv4(),
      key: drawnTemplate.key,
      label: drawnTemplate.label,
      handler: drawnTemplate.handler
    };

    player.devCards = player.devCards || [];
    player.devCards.push(cardInstance);
    deductResources(player, DEVELOPMENT_CARD_COST);
    game.logs.push(`${player.name} bought a development card.`);

    store.saveGame(roomId, game);
    return game;
  },

  playDevelopmentCard: (roomId, uid, cardId, payload = {}) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");
    if (game.phase === "SETUP") {
      throw new Error("You cannot play development cards during setup.");
    }

    const player = game.players.find((p) => p.id === uid);
    if (!player) throw new Error("Player not found in game");

    const hand = player.devCards || [];
    const cardIndex = hand.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      throw new Error("Development card not found in hand.");
    }

    const card = hand[cardIndex];
    const handler = DEVELOPMENT_CARD_HANDLERS[card.handler];
    if (!handler) {
      throw new Error("No handler registered for this card.");
    }

    handler({ game, player }, payload);
    hand.splice(cardIndex, 1);
    game.devCardDiscard = game.devCardDiscard || [];
    game.devCardDiscard.push(card);

    store.saveGame(roomId, game);
    return game;
  },

  rollDice: (roomId, uid) => {
    const game = store.getGame(roomId);
    if (game.currentTurn !== uid) throw new Error("Not your turn");
    if (game.phase !== "ROLL_DICE") throw new Error("Cannot roll now");

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    game.diceResult = [d1, d2];
    game.logs.push(`${uid} rolled ${total}`);

    if (total !== 7) {
      const activeHexes = Object.values(game.board.hexes).filter(
        (h) => h.number === total && h.resource !== 'desert'
      );

      activeHexes.forEach((hex) => {
        Object.entries(game.board.buildings).forEach(([locKey, building]) => {
          if (building.type === 'road') return;

          if (doesBuildingTouchHex(hex, locKey)) {
            const player = game.players.find((p) => p.id === building.owner);
            if (player) {
              const qty = building.type === 'city' ? 2 : 1;
              player.resources[hex.resource] += qty;
              game.logs.push(`${player.name} got ${qty} ${hex.resource}`);
            }
          }
        });
      });
    }

    game.phase = "MAIN_TURN";
    store.saveGame(roomId, game);
    return game;
  },

  endTurn: (roomId, uid) => {
    const game = store.getGame(roomId);
    if (game.currentTurn !== uid) throw new Error("Not your turn");

    const N = game.players.length;

    if (game.phase === "SETUP") {
        game.setupTurnIndex++;
        const maxSetupTurns = N * 2; 

        if (game.setupTurnIndex >= maxSetupTurns) {
            game.phase = "ROLL_DICE"; 
            game.turnIndex = 0;
            game.currentTurn = game.turnOrder[0];
            game.logs.push("Setup complete! First turn begins.");
          game.setupRequirement = null;
        } else {
            // Calculate Next Player (Snake Draft)
            let playerIndex;
            if (game.setupTurnIndex < N) {
                playerIndex = game.setupTurnIndex; // 0, 1, 2, 3
            } else {
                playerIndex = (2 * N - 1) - game.setupTurnIndex; // 3, 2, 1, 0
            }
            game.currentTurn = game.turnOrder[playerIndex];
            
            // Add a log so you know why it's your turn again
            const nextName = game.players.find(p => p.id === game.currentTurn).name;
            game.logs.push(`Setup Round: ${nextName} to place structure.`);
          game.setupRequirement = { expect: "settlement", pendingSettlement: null };
        }
    } 
    else {
        // Normal Game Loop
        game.turnIndex = (game.turnIndex + 1) % N;
        game.currentTurn = game.turnOrder[game.turnIndex];
        game.phase = "ROLL_DICE";
        game.diceResult = null;
        game.setupRequirement = null;
    }

    store.saveGame(roomId, game);
    return game;
  }
};

module.exports = GameService;