const express = require('express');
const router = express.Router();
const { createTask, updateTaskStatus, getTaskActivity, getTasksByProject, deleteTask ,uploadAttachment} = require('../controllers/task.controller');
const authGuard = require('../middleware/authGuard');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

router.post('/', authGuard, createTask);
router.get('/', authGuard, getTasksByProject);
router.patch('/:id/status', authGuard, updateTaskStatus);
router.get('/:id/activity', authGuard, getTaskActivity);
router.delete('/:id', authGuard, roleGuard('ADMIN', 'MANAGER'), deleteTask);
router.post('/:id/attachment', authGuard, upload.single('file'), uploadAttachment);

module.exports = router;