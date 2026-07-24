require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const createApp = require('./src/app');
const connectMongoDB = require('./src/config/db');
const initializeSocket = require('./src/sockets/socket');

const PORT = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

connectMongoDB();

async function startServer() {
  const app = await createApp(); // await the fully-built app, WITH GraphQL already mounted

  const server = http.createServer(app);

  const io = new Server(server, { cors: { origin: '*' } });
  initializeSocket(io);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer();