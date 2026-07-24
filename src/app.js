const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const helmet = require('helmet');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const morgan = require('morgan');
const logger = require('./utils/logger');
const healthCheck = require('./controllers/health.controller');
const setupGraphQL = require('./graphql/server');

async function createApp() {
  const app = express();

  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/', generalLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/uploads', express.static('uploads'));

  app.get('/', (req, res) => {
    res.json({ message: 'Task Manager API is running' });
  });

  app.get('/health', healthCheck);

  // Setup GraphQL BEFORE the catch-all — must be registered before the 404 handler
  await setupGraphQL(app);

  // catch requests to routes that don't exist at all
  app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
  });

  // error handler MUST be registered last
  app.use(errorHandler);

  return app;
}

module.exports = createApp;