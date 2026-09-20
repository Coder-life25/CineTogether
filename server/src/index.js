const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const cleanupService = require('./services/cleanupService');
const WSServer = require('./websocket/wsServer');
const logger = require('./utils/logger');

async function startServer() {
  await connectDB();
  
  const server = http.createServer(app);
  
  // Attach WebSocket server
  const wsServer = new WSServer(server);
  
  // Start cleanup scheduler
  cleanupService.startCleanupScheduler();

  server.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port} in ${env.nodeEnv} mode`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    cleanupService.stopCleanupScheduler();
    
    server.close(async () => {
      logger.info('HTTP server closed');
      wsServer.wss.close();
      await disconnectDB();
      process.exit(0);
    });
    
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
