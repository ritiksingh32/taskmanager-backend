const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // attach decoded user info to the request, so later handlers can use it
    req.user = decoded; // contains userId, role, orgId
    next();
  });
};

module.exports = authGuard;