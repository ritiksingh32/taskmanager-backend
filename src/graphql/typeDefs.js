const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    orgId: String!
  }

  type Project {
    id: ID!
    name: String!
    orgId: String!
    tasks: [Task!]
  }

  type Task {
    id: ID!
    title: String!
    status: String!
    projectId: String!
    assigneeId: String
    attachmentUrl: String
    createdAt: String!
  }

  type Query {
    projects: [Project!]!
    project(id: ID!): Project
    tasks(projectId: ID!): [Task!]!
  }

  type Mutation {
    createProject(name: String!): Project!
    createTask(title: String!, projectId: ID!): Task!
    updateTaskStatus(taskId: ID!, status: String!): Task!
  }
`;

module.exports = typeDefs;