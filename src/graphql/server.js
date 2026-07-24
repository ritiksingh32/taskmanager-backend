const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const express = require('express');
const jwt = require('jsonwebtoken');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

async function setupGraphQL(app) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    express.json(),
    (req, res, next) => {
      if (!req.body) req.body = {}; // fallback for GET landing page requests with no body
      next();
    },
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
          return { user: null };
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          return { user: decoded };
        } catch (err) {
          return { user: null };
        }
      },
    })
  );
}

module.exports = setupGraphQL;