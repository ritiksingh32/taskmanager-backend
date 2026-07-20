const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // catches any rejected promise, forwards to error middleware
  };
};

module.exports = asyncHandler;