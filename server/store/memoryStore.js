const games = {};

module.exports = {
  getGame: (id) => games[id],
  saveGame: (id, state) => { games[id] = state; },
  deleteGame: (id) => delete games[id],
  getAll: () => games
};