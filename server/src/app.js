const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const roomsRouter = require('./routes/rooms');
const videoRouter = require('./routes/video');
const healthRouter = require('./routes/health');

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/', apiLimiter);

app.use('/api/rooms', roomsRouter);
app.use('/api/rooms/:roomId/video', videoRouter);
app.use('/api/health', healthRouter);

app.use((req, res, next) => {
  res.status(404).json({ error: { message: 'Not Found', code: 'NOT_FOUND' } });
});

app.use(errorHandler);

module.exports = app;
