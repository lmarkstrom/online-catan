// server/controllers/gameController.js
const GameService = require('../services/gameService');

module.exports = (io, socket) => {
  
  // --- HANDLER: Create Lobby ---
  const createLobby = ({ name }) => {
    try {
      // 1. Call Service
      const game = GameService.createGame(name, socket.id);
      
      // 2. Join the Socket Room (Socket.io feature)
      socket.join(game.id);
      
      // 3. Reply to Client
      socket.emit("lobby_created", game);
      console.log(`[CREATE] Game ${game.id} created by ${name}`);
      
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // --- HANDLER: Join Lobby ---
  const joinLobby = ({ roomId, name }) => {
    try {
      // 1. Call Service
      const game = GameService.joinGame(roomId, name, socket.id);
      
      // 2. Join the Socket Room
      socket.join(roomId);
      
      // 3. Broadcast to EVERYONE in that room (including sender)
      io.to(roomId).emit("game_updated", game); // Everyone updates their list
      
      console.log(`[JOIN] ${name} joined ${roomId}`);

    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // --- LISTENERS ---
  socket.on("create_lobby", createLobby);
  socket.on("join_lobby", joinLobby);
};