// server/server.js
require('dotenv').config(); // <--- MUST BE THE FIRST LINE

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();

// Use the variable for CORS
app.use(cors({ origin: process.env.CLIENT_URL }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // <--- Allow only this URL to connect
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowing connections from: ${process.env.CLIENT_URL}`);
});