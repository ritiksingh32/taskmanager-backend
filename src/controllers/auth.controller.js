const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password, orgName } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password — NEVER store plain text passwords
    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    // 3. Create an Organization for this user (since it's multi-tenant)
    const organization = await prisma.organization.create({
      data: { name: orgName }
    });

    // 4. Create the User, linked to that Organization, as ADMIN (first user = admin of their org)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        orgId: organization.id,
        role: 'ADMIN'
      }
    });

    // 5. Don't send the password back in the response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn('Failed login attempt - user not found', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Failed login attempt - wrong password', { email });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, orgId: user.orgId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId }
    });

  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
};

const adminOnlyTest = async (req, res) => {
  res.json({ message: 'You are an ADMIN, welcome', user: req.user });
};

const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }

      // fetch the fresh user data from DB, in case role changed since the original login
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // issue a NEW access token
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role, orgId: user.orgId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: false, // true in production
    sameSite: 'strict'
  });
  res.json({ message: 'Logged out successfully' });
};

// Register a SECOND user, joining an EXISTING organization (as MEMBER)
const registerWithOrgId = asyncHandler(async (req, res) => {
  const { name, email, password, orgId } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  // verify the org actually exists
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new AppError('Organization not found', 404);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      orgId,
      role: 'MEMBER' // joining users are always MEMBER by default
    }
  });

  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ message: 'Joined organization successfully', user: userWithoutPassword });
});

module.exports = { register, login, getMe, adminOnlyTest, refreshAccessToken, logout, registerWithOrgId };