const rateLimit = require('express-rate-limit');

// General limiter — applies broadly across the API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false,
});

// Stricter limiter specifically for auth routes (prevent brute-force login/register attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // only 10 attempts per 15 min per IP
  message: { message: 'Too many login/register attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter };