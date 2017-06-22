const crypto = require('crypto');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const fakeDataBase = {};

const schema = buildSchema(`
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }
  
  input MessageInput {
    content: String
    author: String
  }
  
  type Message {
    id: ID!
    content: String
    author: String
  }
  
  type Query {
    quoteOfTheDay: String
    random: Float!
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
  }
  
  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

class RandomDie {
  constructor(numSides = 6) {
    this.numSides = numSides;
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }

  roll({ numRolls }) {
    const output = [];
    for (let i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

const root = {
  quoteOfTheDay: () => (Math.random() < 0.5 ? 'Take it easy' : 'Salvation lies within'),
  random: () => Math.random(),
  getDie: ({ numSides }) => new RandomDie(numSides),
  getMessage: ({ id }) => {
    if (!fakeDataBase[id]) {
      throw new Error(`no message exists with id ${id}`);
    }
    return new Message(id, fakeDataBase[id]);
  },
  createMessage: ({ input }) => {
    const id = crypto.randomBytes(10).toString('hex');
    fakeDataBase[id] = input;
    return new Message(id, input);
  },
  updateMessage: (id, { input }) => {
    if (!fakeDataBase[id]) {
      throw new Error(`no message exists with id ${id}`);
    }
    fakeDataBase[id] = input;
    return new Message(id, input);
  },
};

const app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
