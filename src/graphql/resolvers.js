const prisma = require('../utils/prismaClient');

const resolvers = {
  Query: {
    projects: async (_, __, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      return prisma.project.findMany({ where: { orgId } });
    },

    project: async (_, { id }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      return prisma.project.findFirst({ where: { id, orgId } });
    },

    tasks: async (_, { projectId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error('Project not found');
      return prisma.task.findMany({ where: { projectId } });
    },
  },

  Mutation: {
    createProject: async (_, { name }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      return prisma.project.create({ data: { name, orgId } });
    },

    createTask: async (_, { title, projectId }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
      if (!project) throw new Error('Project not found');
      return prisma.task.create({ data: { title, projectId } });
    },

    updateTaskStatus: async (_, { taskId, status }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { orgId } = context.user;
      const task = await prisma.task.findFirst({
        where: { id: taskId },
        include: { project: true }
      });
      if (!task || task.project.orgId !== orgId) throw new Error('Task not found');

      return prisma.task.update({ where: { id: taskId }, data: { status } });
    },
  },

  Project: {
    tasks: async (parent) => {
      return prisma.task.findMany({ where: { projectId: parent.id } });
    },
  },
};

module.exports = resolvers;