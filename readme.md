# GraphQL Server Example

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

## Running the Server

Start the server:
```bash
pnpm start
```

## GraphQL Playground

- Query Endpoint: `http://localhost:4000/graphql`
- Subscription Endpoint: `ws://localhost:4000/graphql`

### Example Queries

#### Hello World Query
```graphql
query {
  helloWorld
}
```

#### Increment Counter Subscription
```graphql
subscription {
  incrementCounter
}
```

## Dependencies

- Apollo Server
- GraphQL Subscriptions
- WebSocket Support

## Notes

- The server exposes two main features:
  1. A `helloWorld` query that returns "Hello, World!"
  2. An `incrementCounter` subscription that sends an incrementing number every second


