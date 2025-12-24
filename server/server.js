const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

// Import the Controller
const registerGameHandlers = require('./controllers/gameController');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your Next.js Client URL
    methods: ["GET", "POST"]
  }
});

// --- SOCKET CONNECTION ---
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Pass the socket to the controller to register events
  registerGameHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('User Disconnected:', socket.id);
    // Optional: Logic to handle player leaving (e.g., pause game)
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Catan Server running on port ${PORT}`);
});