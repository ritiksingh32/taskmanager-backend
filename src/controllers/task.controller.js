const prisma = require('../utils/prismaClient');
const ActivityLog = require('../models/ActivityLog.model');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// CREATE a task
const createTask = asyncHandler(async (req, res) => {
  const { title, projectId } = req.body;
  const { userId, orgId } = req.user;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId }
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const task = await prisma.task.create({
    data: { title, projectId }
  });

  await ActivityLog.create({
    orgId,
    taskId: task.id,
    userId,
    action: 'TASK_CREATED',
    details: { title }
  });

  res.status(201).json({ message: 'Task created', task });
});

// GET all tasks for a specific project
const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const { orgId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId }
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where: { projectId } }),
  ]);

  res.json({
    tasks,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    },
  });
});

// UPDATE task status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { userId, orgId } = req.user;

  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true }
  });

  if (!task || task.project.orgId !== orgId) {
    throw new AppError('Task not found', 404);
  }

  const oldStatus = task.status;

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status }
  });

  await ActivityLog.create({
    orgId,
    taskId: id,
    userId,
    action: 'STATUS_CHANGED',
    details: { from: oldStatus, to: status }
  });

  const io = req.app.get('io');
  io.to(`org_${orgId}`).emit('task_updated', {
    taskId: id,
    newStatus: status,
    updatedBy: userId
  });

  res.json({ message: 'Task updated', task: updatedTask });
});

// GET activity log for a task
const getTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  // verify the task belongs to this org before showing its logs
  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true }
  });
  if (!task || task.project.orgId !== orgId) {
    throw new AppError('Task not found', 404);
  }

  const logs = await ActivityLog.find({ taskId: id }).sort({ createdAt: -1 });
  res.json({ logs });
});

// DELETE a task
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true }
  });

  if (!task || task.project.orgId !== orgId) {
    throw new AppError('Task not found', 404);
  }

  await prisma.task.delete({ where: { id } });

  res.json({ message: 'Task deleted' });
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.user;

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const task = await prisma.task.findFirst({
    where: { id },
    include: { project: true }
  });
  if (!task || task.project.orgId !== orgId) {
    throw new AppError('Task not found', 404);
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { attachmentUrl: `/uploads/${req.file.filename}` }
  });

  res.json({ message: 'File uploaded', task: updatedTask });
});

module.exports = { createTask, getTasksByProject, updateTaskStatus, getTaskActivity, deleteTask, uploadAttachment };