const logger = require('../utils/logger');
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} - ${err.message}`, err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      ...(env.nodeEnv === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
