const jwt = require('jsonwebtoken');

const initializeSocket = (io) => {
  // Middleware for Socket.io itself — authenticate BEFORE allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }
      socket.user = decoded; // attach decoded user info to the socket itself
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);

    // Join a "room" specific to this user's organization
    socket.join(`org_${socket.user.orgId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
    });
  });
};

module.exports = initializeSocket;