// server/store/memoryStore.js

// The "Database"
const games = {};

module.exports = {
  // Retrieve a game by ID
  getGame: (id) => games[id],

  // Save or Update a game
  saveGame: (id, gameState) => {
    games[id] = gameState;
  },

  // Delete a game (optional cleanup)
  deleteGame: (id) => {
    delete games[id];
  },

  // (Debug) See all games
  getAll: () => games
};