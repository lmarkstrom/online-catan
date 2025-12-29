const GameService = require('../services/gameService');

module.exports = (io, socket) => {
  
  // 1. Create Lobby
  const createLobby = ({ name, uid }) => {
    try {
      const hostId = uid || socket.id;
      const hostName = name || "Unknown";

      if (!uid) console.warn("WARNING: Creating game without UID. Using Socket ID.");

      const game = GameService.createGame(hostName, hostId);
      
      socket.join(game.id);
      socket.emit("lobby_created", game);
      console.log(`[CREATE] Game ${game.id} created by ${hostName} (${hostId})`);
      
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // 2. Join Lobby
  const joinLobby = ({ roomId, name, uid }) => {
    try {
      const playerId = uid || socket.id;
      const playerName = name || "Unknown";
      
      // Get the object from service
      const result = GameService.joinGame(roomId, playerName, playerId);
      
      // Handle the new return format
      const game = result.game || result; 
      const isNew = result.isNew;

      socket.join(roomId);
      io.to(roomId).emit("game_updated", game);

      if (isNew) {
        console.log(`[JOIN] ${playerName} (${playerId}) joined ${roomId}`);
      } else {
        // Silence re-joins
      }

    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // 3. Game Actions (Start, Place, Roll, End)
  const startGame = ({ roomId, uid }) => {
    try {
      const updatedGame = GameService.startGame(roomId, uid);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  const placeStructure = ({ roomId, uid, type, location }) => {
    try {
      console.log(`[BUILD] Player ${uid} trying to build ${type} at ${location}`);
      const updatedGame = GameService.placeStructure(roomId, uid, type, location);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
       console.error(`[BUILD ERROR] ${err.message}`);
       socket.emit("error", { message: err.message });
    }
  };

  const rollDice = ({ roomId, uid }) => {
    try {
      const updatedGame = GameService.rollDice(roomId, uid);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
       socket.emit("error", { message: err.message });
    }
  };

  const endTurn = ({ roomId, uid }) => {
    try {
      const updatedGame = GameService.endTurn(roomId, uid);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
       socket.emit("error", { message: err.message });
    }
  };

  const buyDevelopmentCard = ({ roomId, uid }) => {
    try {
      const updatedGame = GameService.buyDevelopmentCard(roomId, uid);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  const playDevelopmentCard = ({ roomId, uid, cardId, payload }) => {
    try {
      const updatedGame = GameService.playDevelopmentCard(roomId, uid, cardId, payload);
      io.to(roomId).emit("game_updated", updatedGame);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  };

  // Register Listeners
  socket.on("create_lobby", createLobby);
  socket.on("join_lobby", joinLobby);
  socket.on("start_game", startGame);
  socket.on("place_structure", placeStructure); 
  socket.on("roll_dice", rollDice);             
  socket.on("end_turn", endTurn);               
  socket.on("buy_dev_card", buyDevelopmentCard);
  socket.on("play_dev_card", playDevelopmentCard);
};