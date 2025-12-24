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

  getGame: (roomId) => {
    return store.getGame(roomId);
  }
};

module.exports = GameService;