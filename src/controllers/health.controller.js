const prisma = require('../utils/prismaClient');
const mongoose = require('mongoose');

const healthCheck = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      postgres: 'unknown',
      mongodb: 'unknown',
    },
  };

  // Check Postgres connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.postgres = 'ok';
  } catch (error) {
    health.checks.postgres = 'error';
    health.status = 'degraded';
  }

  // Check MongoDB connectivity
  health.checks.mongodb = mongoose.connection.readyState === 1 ? 'ok' : 'error';
  if (health.checks.mongodb === 'error') {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};

module.exports = healthCheck;