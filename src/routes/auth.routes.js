const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, adminOnlyTest, refreshAccessToken, logout,registerWithOrgId } = require('../controllers/auth.controller');
const authGuard = require('../middleware/authGuard');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('orgName').trim().notEmpty().withMessage('Organization name is required')
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authGuard, getMe);
router.get('/admin-only', authGuard, roleGuard('ADMIN'), adminOnlyTest);
router.post('/join', registerWithOrgId);

module.exports = router;