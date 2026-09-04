const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { createAuditLog } = require('../services/auditService');

/**
 * GET /api/roles
 * List all roles
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions')
      .sort({ name: 1 });

    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/roles/:id
 * Get a single role by ID
 */
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/roles
 * Create a new role (Admin only)
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions, zohoApps } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(409).json({ message: 'Role already exists' });
    }

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      zohoApps: zohoApps || []
    });

    await role.save();
    await role.populate('permissions');

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'CREATE_ROLE',
      resource: 'role',
      details: { roleName: name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/roles/:id
 * Update a role (Admin only)
 */
exports.updateRole = async (req, res) => {
  try {
    const { name, description, zohoApps, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (zohoApps) updateData.zohoApps = zohoApps;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'UPDATE_ROLE',
      resource: 'role',
      details: { roleName: role.name, changes: Object.keys(updateData) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      message: 'Role updated successfully',
      role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/roles/:id
 * Delete a role (Admin only)
 */
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent deletion of Admin role
    if (role.name === 'Admin') {
      return res.status(400).json({ message: 'Cannot delete the Admin role' });
    }

    await Role.findByIdAndDelete(req.params.id);

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'DELETE_ROLE',
      resource: 'role',
      details: { roleName: role.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/roles/:id/permissions
 * Assign permissions to a role (Admin only)
 */
exports.assignPermissions = async (req, res) => {
  try {
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds array is required' });
    }

    // Validate all permission IDs exist
    const permissions = await Permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({ message: 'One or more permission IDs are invalid' });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions: permissionIds },
      { new: true }
    ).populate('permissions');

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'ASSIGN_PERMISSIONS',
      resource: 'role',
      details: {
        roleName: role.name,
        permissions: permissions.map(p => p.name)
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      message: 'Permissions assigned successfully',
      role
    });
  } catch (error) {
    console.error('Assign permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/roles/permissions
 * List all available permissions
 */
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ resource: 1, action: 1 });
    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
