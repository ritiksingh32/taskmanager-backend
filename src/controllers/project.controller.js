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
const getProjects = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [projects, totalCount] = await Promise.all([
    prisma.project.findMany({
      where: { orgId },
      skip,
      take: limit,
      orderBy: { id: 'desc' }, // consistent ordering — important for pagination correctness
    }),
    prisma.project.count({ where: { orgId } }),
  ]);

  res.json({
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    },
  });
});

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