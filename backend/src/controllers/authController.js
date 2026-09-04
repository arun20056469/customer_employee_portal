const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAuditLog } = require('../services/auditService');

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

    if (!user) {
      await createAuditLog({
        userId: '000000000000000000000000',
        userName: email,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { reason: 'User not found', email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated. Contact your administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await createAuditLog({
        userId: user._id,
        userName: user.name,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        details: { reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Log successful login
    await createAuditLog({
      userId: user._id,
      userName: user.name,
      action: 'LOGIN',
      resource: 'auth',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(r => ({ id: r._id, name: r.name })),
        lastLogin: user.lastLogin
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * POST /api/auth/register
 * Register a new user (Admin only)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, roles } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      roles: roles || []
    });

    await user.save();

    // Populate roles for response
    await user.populate('roles');

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_USER',
      resource: 'user',
      details: { createdUser: user.email, assignedRoles: roles },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(r => ({ id: r._id, name: r.name })),
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh JWT access token using refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Find user and verify stored refresh token
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired. Please login again.' });
    }
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(r => ({
          id: r._id,
          name: r.name,
          description: r.description,
          permissions: r.permissions.map(p => ({
            id: p._id,
            name: p.name,
            resource: p.resource,
            action: p.action
          })),
          zohoApps: r.zohoApps
        })),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
