const express = require('express');
const cors = require('cors');

const jobsRouter = require('./routes/jobs');
const authRouter = require('./routes/auth');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
  app.use(express.json({ limit: '50kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/jobs', jobsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
