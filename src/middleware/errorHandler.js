const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { 
    stack: err.stack, 
    path: req.path, 
    method: req.method,
    userId: req.user?.userId 
  });

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong on our end';

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;