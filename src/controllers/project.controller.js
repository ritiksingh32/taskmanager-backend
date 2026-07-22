const prisma = require('../utils/prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const redis = require('../utils/redisClient');

// CREATE a project — scoped to the logged-in user's organization
const createProject = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { orgId } = req.user;

  const project = await prisma.project.create({ data: { name, orgId } });

  const keys = await redis.keys(`projects:${orgId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  res.status(201).json({ message: 'Project created', project });
});

// GET all projects — ONLY for this user's organization (multi-tenancy enforcement)
const getProjects = asyncHandler(async (req, res) => {
  const { orgId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `projects:${orgId}:page:${page}:limit:${limit}`;

  // 1. Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, source: 'cache' });
  }

  // 2. Cache miss — fetch from Postgres
  const [projects, totalCount] = await Promise.all([
    prisma.project.findMany({
      where: { orgId },
      skip,
      take: limit,
      orderBy: { id: 'desc' },
    }),
    prisma.project.count({ where: { orgId } }),
  ]);

  const responseData = {
    projects,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    },
  };

  // 3. Store in cache for next time, expire after 60 seconds
  await redis.set(cacheKey, responseData, { ex: 60 });

  res.json({ ...responseData, source: 'database' });
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