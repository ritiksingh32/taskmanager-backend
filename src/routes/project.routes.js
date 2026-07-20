const express = require('express');
const router = express.Router();
const { createProject, getProjects,getProjectById } = require('../controllers/project.controller');
const authGuard = require('../middleware/authGuard');
const roleGuard = require('../middleware/roleGuard');

router.post('/', authGuard, roleGuard('ADMIN', 'MANAGER'), createProject);
router.get('/', authGuard, getProjects);
router.get('/:id', authGuard, getProjectById);

module.exports = router;