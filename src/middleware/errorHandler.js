const errorHandler = (err, req, res, next) => {
  console.error(err); // log full error server-side for debugging

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong on our end';

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;