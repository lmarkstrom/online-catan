// server/services/gameService.js
const store = require('../store/memoryStore');
const { v4: uuidv4 } = require('uuid'); // Run: npm install uuid

const GameService = {
  
  createGame: (hostName, hostId) => {
    // 1. Generate a short unique Room ID (e.g., "a1b2")
    const roomId = uuidv4().slice(0, 4).toUpperCase();
    
    // 2. Initialize the Game State Skeleton
    const newGame = {
      id: roomId,
      hostId: hostId,
      status: 'WAITING', // WAITING, PLAYING, FINISHED
      players: [
        { 
          id: hostId, 
          name: hostName, 
          color: 'red', 
          ready: false 
        }
      ],
      // This is where your big Catan board object will eventually go
      board: {}, 
      turnIndex: 0,
      logs: [`Game created by ${hostName}`]
    };

    // 3. Save to Store
    store.saveGame(roomId, newGame);
    return newGame;
  },

  joinGame: (roomId, playerName, playerId) => {
    // 1. Check if game exists
    const game = store.getGame(roomId);
    if (!game) throw new Error("Room not found");

    // 2. Check if game is full (Max 4 for Catan)
    if (game.players.length >= 4) throw new Error("Room is full");

    // 3. Check if already started
    if (game.status !== 'WAITING') throw new Error("Game already in progress");

    // 4. Add Player
    const newPlayer = {
      id: playerId,
      name: playerName,
      color: 'blue', // You'll need logic to pick unused colors later
      ready: false
    };

    game.players.push(newPlayer);
    game.logs.push(`${playerName} joined the lobby`);

    // 5. Save Update
    store.saveGame(roomId, game);
    return game;
  },

  startGame: (roomId, requesterId) => {
    const game = store.getGame(roomId);
    
    // Validations
    if (!game) throw new Error("Game not found");
    if (game.hostId !== requesterId) throw new Error("Only the host can start the game");
    if (game.status !== 'WAITING') throw new Error("Game already started");
    
    // Note: Usually you check for min 2 players, but for testing alone, you might skip this
    // if (game.players.length < 2) throw new Error("Need at least 2 players"); 

    // Update Status
    game.status = 'PLAYING';
    
    // Initialize Game Logic
    game.currentTurn = game.players[0].id; // First player starts
    game.phase = "ROLL_DICE"; // Game phases: ROLL_DICE, TRADING, BUILDING
    game.diceResult = null; // Reset dice

    // Save and Return
    store.saveGame(roomId, game);
    return game;
  },

  getGame: (roomId) => {
    return store.getGame(roomId);
  }
};

module.exports = GameService;