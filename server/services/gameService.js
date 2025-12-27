const store = require('../store/memoryStore');
const { generateBoard, doesBuildingTouchHex } = require('../utils/boardUtils');
const { v4: uuidv4 } = require('uuid');

const GameService = {
  createGame: (hostName, hostId) => {
    const roomId = uuidv4().slice(0, 4).toUpperCase();
    const newGame = {
      id: roomId,
      hostId: hostId,
      status: 'WAITING',
      players: [{ 
          id: hostId, name: hostName, color: 'red', ready: false, 
          resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 } 
      }],
      board: {}, 
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
      resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 }
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
    
    game.phase = "SETUP"; 
    game.turnOrder = game.players.map(p => p.id); // e.g., [A, B, C, D]
    game.currentTurn = game.turnOrder[0];
    game.setupTurnIndex = 0; // Counts 0 to (Players*2 - 1)

    game.logs.push("Game Started! Setup Phase Begins.");
    store.saveGame(roomId, game);
    return game;
  },

  placeStructure: (roomId, uid, type, location) => {
    const game = store.getGame(roomId);
    if (game.currentTurn !== uid) throw new Error("Not your turn");

    // 1. PHASE VALIDATION
    if (game.phase === "ROLL_DICE") throw new Error("You must roll the dice first!");
    if (game.board.buildings[location]) throw new Error("Spot occupied");

    // 2. Add Building
    game.board.buildings[location] = { type, owner: uid };
    game.logs.push(`Player built a ${type}`);

    // 3. SETUP PHASE: Auto-end turn
    if (game.phase === "SETUP") {
        return GameService.endTurn(roomId, uid);
    }
    
    // In MAIN_TURN, we do NOT auto-end turn. 
    // You would add resource cost deduction logic here later.

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

    // --- DISTRIBUTE RESOURCES ---
    if (total !== 7) {
        // 1. Find all Hexes that match the dice roll
        const activeHexes = Object.values(game.board.hexes).filter(
            h => h.number === total && h.resource !== 'desert'
        );

        // 2. For each active Hex, find ANY building that touches it
        activeHexes.forEach(hex => {
            Object.entries(game.board.buildings).forEach(([locKey, building]) => {
                
                // Skip roads for now (they don't get resources)
                if (building.type === 'road') return;

                // USE THE NEW CHECK
                if (doesBuildingTouchHex(hex, locKey)) {
                    const player = game.players.find(p => p.id === building.owner);
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

        // LOGIC FIX: Check if we are done
        if (game.setupTurnIndex >= maxSetupTurns) {
            game.phase = "ROLL_DICE"; // <--- UNLOCKS ROLL BUTTON
            game.turnIndex = 0;
            game.currentTurn = game.turnOrder[0];
            game.logs.push("Setup complete! First turn begins.");
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
        }
    } 
    else {
        // Normal Game Loop
        game.turnIndex = (game.turnIndex + 1) % N;
        game.currentTurn = game.turnOrder[game.turnIndex];
        game.phase = "ROLL_DICE";
        game.diceResult = null;
    }

    store.saveGame(roomId, game);
    return game;
  }
};

module.exports = GameService;