const User = require('../models/User');
const Role = require('../models/Role');
const { createAuditLog } = require('../services/auditService');

/**
 * GET /api/users
 * List all users with pagination (Admin only)
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('roles', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/users/:id
 * Update user details (Admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, isActive, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If password is being updated, hash it
    if (password) {
      user.password = password;
      await user.save();
    }

    // Update other fields
    Object.assign(user, updateData);
    await user.save({ validateBeforeSave: false });
    await user.populate('roles', 'name description');

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_USER',
      resource: 'user',
      details: { updatedUser: user.email, changes: Object.keys(updateData) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/users/:id
 * Soft-delete (deactivate) a user (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'DEACTIVATE_USER',
      resource: 'user',
      details: { deactivatedUser: user.email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/users/:id/roles
 * Assign roles to a user (Admin only)
 */
exports.assignRoles = async (req, res) => {
  try {
    const { roleIds } = req.body;

    if (!roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({ message: 'roleIds array is required' });
    }

    // Validate all role IDs exist
    const roles = await Role.find({ _id: { $in: roleIds } });
    if (roles.length !== roleIds.length) {
      return res.status(400).json({ message: 'One or more role IDs are invalid' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRoles = user.roles;
    user.roles = roleIds;
    await user.save({ validateBeforeSave: false });
    await user.populate('roles', 'name description');

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'ASSIGN_ROLES',
      resource: 'user',
      details: {
        targetUser: user.email,
        oldRoles: oldRoles,
        newRoles: roles.map(r => r.name)
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      message: 'Roles assigned successfully',
      user
    });
  } catch (error) {
    console.error('Assign roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
