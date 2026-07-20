const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was already set by authGuard, which MUST run before this middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

module.exports = roleGuard;