require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectMongoDB = require('./src/config/db');
const initializeSocket = require('./src/sockets/socket');

const PORT = process.env.PORT || 5000;

// ensure uploads folder exists at runtime
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

connectMongoDB();

// Create a raw HTTP server, wrapping the Express app
const server = http.createServer(app);

// Attach Socket.io to that SAME server
const io = new Server(server, {
  cors: { origin: '*' } // for dev; restrict this in production
});

initializeSocket(io);

// make `io` accessible inside Express controllers (important — explained below)
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});