const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');

// Create a PubSub instance
const pubsub = new PubSub();

// Define type definitions
const typeDefs = `
  type Query {
    helloWorld: String
  }

  type Subscription {
    incrementCounter: Int
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    helloWorld: () => 'Hello, World!'
  },
  Subscription: {
    incrementCounter: {
      subscribe: () => {
        let counter = 0;
        const intervalId = setInterval(() => {
          counter++;
          pubsub.publish('INCREMENT_COUNTER', { incrementCounter: counter });
        }, 1000);

        // Cleanup function to stop the interval when subscription ends
        return {
          [Symbol.asyncIterator]() {
            return {
              next() {
                return new Promise((resolve) => {
                  pubsub.subscribe('INCREMENT_COUNTER', (payload) => {
                    resolve({ 
                      value: { incrementCounter: payload.incrementCounter },
                      done: false 
                    });
                  });
                });
              },
              return() {
                clearInterval(intervalId);
                return { done: true };
              }
            };
          }
        };
      }
    }
  }
};

// Create executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// Create Apollo Server with drain plugin
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server
    ApolloServerPluginDrainHttpServer({ httpServer }),
    
    // Proper shutdown for the WebSocket server
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await wsServer.close();
          }
        };
      }
    }
  ]
});

// WebSocket Server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

// Use the WebSocket server for GraphQL subscriptions
useServer({ schema }, wsServer);

// Async function to start the server
async function startServer() {
  // Start the Apollo Server
  await server.start();

  // Apply middleware to Express app
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server)
  );

  // Start the server
  const PORT = 4000;
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🌐 WebSocket server running at ws://localhost:${PORT}/graphql`);
}

startServer().catch(console.error);

// Note: To run this server, you'll need to install the following dependencies:
// npm install @apollo/server express cors body-parser graphql-subscriptions graphql-ws ws @graphql-tools/schema