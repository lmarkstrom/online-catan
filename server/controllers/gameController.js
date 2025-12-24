const GameService = require('../services/gameService');

module.exports = (io, socket) => {
  
  // --- EVENT: CREATE LOBBY ---
  const createLobby = ({ name }) => {
    try {
      const game = GameService.createGame(name, socket.id);
      
      socket.join(game.id);
      socket.emit("lobby_created", game);
      console.log(`Game created: ${game.id} by ${name}`);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // --- EVENT: JOIN LOBBY ---
  const joinLobby = ({ roomId, name }) => {
    try {
      const game = GameService.joinGame(roomId, name, socket.id);
      
      socket.join(roomId);
      // Notify everyone in the room (including sender)
      io.to(roomId).emit("game_updated", game);
      console.log(`${name} joined ${roomId}`);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // --- EVENT: BUILD ROAD ---
  const buildRoad = ({ roomId, coords }) => {
    try {
      const updatedGame = GameService.buildRoad(roomId, socket.id, coords);
      
      // Broadcast new board state to everyone
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
      // Only tell the user who failed
      socket.emit("error", { message: err.message });
    }
  };

  // --- MAPPING EVENTS ---
  socket.on("create_lobby", createLobby);
  socket.on("join_lobby", joinLobby);
  socket.on("build_road", buildRoad);
};