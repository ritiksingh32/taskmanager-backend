const prisma = require('../utils/prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// CREATE a project — scoped to the logged-in user's organization
const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const { orgId } = req.user; // from the JWT payload, via authGuard

    const project = await prisma.project.create({
      data: { name, orgId }
    });

    res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET all projects — ONLY for this user's organization (multi-tenancy enforcement)
const getProjects = async (req, res) => {
  try {
    const { orgId } = req.user;

    const projects = await prisma.project.findMany({
      where: { orgId } // critical line — this is what prevents cross-tenant data leaks
    });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  const project = await prisma.project.findFirst({
    where: { id, orgId },
    include: { tasks: true } // bonus: include its tasks in the same response
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({ project });
});

module.exports = { createProject, getProjects, getProjectById };