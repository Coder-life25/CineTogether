const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests from this IP, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

const createRoomLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many rooms created from this IP, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

const uploadInitiateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many uploads initiated from this IP, please try again later.', code: 'RATE_LIMIT_EXCEEDED' } }
});

module.exports = {
  apiLimiter,
  createRoomLimiter,
  uploadInitiateLimiter
};
