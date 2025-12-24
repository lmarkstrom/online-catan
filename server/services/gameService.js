const store = require('../store/memoryStore');
const { v4: uuidv4 } = require('uuid'); // Run: npm install uuid

const GameService = {
  createGame: (hostName, hostId) => {
    const roomId = uuidv4().slice(0, 6); // Short ID like "a3f1b"
    
    const newGame = {
      id: roomId,
      players: [{ id: hostId, name: hostName, color: 'red', resources: {} }],
      board: {}, // Initialize your Catan Hex Grid here
      turnIndex: 0,
      status: 'WAITING'
    };

    store.saveGame(roomId, newGame);
    return newGame;
  },

  joinGame: (roomId, playerName, playerId) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");
    if (game.status !== 'WAITING') throw new Error("Game already started");

    const newPlayer = { id: playerId, name: playerName, color: 'blue', resources: {} };
    game.players.push(newPlayer);
    
    // Check if full (simple logic for now)
    if (game.players.length >= 4) game.status = 'FULL';

    store.saveGame(roomId, game);
    return game;
  },

  buildRoad: (roomId, playerId, coords) => {
    const game = store.getGame(roomId);
    if (!game) throw new Error("Game not found");

    // GAME RULES CHECK
    const player = game.players.find(p => p.id === playerId);
    
    // 1. Check Turn
    // if (game.players[game.turnIndex].id !== playerId) throw new Error("Not your turn");

    // 2. Check Resources (Example)
    // if (player.resources.wood < 1 || player.resources.brick < 1) throw new Error("Not enough resources");

    // 3. Execute Build
    if (!game.board.roads) game.board.roads = [];
    game.board.roads.push({ owner: playerId, coords });

    // 4. Update Database
    store.saveGame(roomId, game);
    
    return game;
  }
};

module.exports = GameService;