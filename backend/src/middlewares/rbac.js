const jwt = require('jsonwebtoken');

/**
 * Role-Based Access Control middleware
 * Checks if the authenticated user has one of the allowed roles
 * 
 * @param {string[]} allowedRoles - Array of role names that are permitted
 * @returns {Function} Express middleware
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Authentication required' });
    }

    // Check if user has at least one of the allowed roles
    const hasPermission = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Access Denied: Insufficient Permissions',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
};

/**
 * Permission-based access control middleware
 * Checks if the authenticated user has a specific permission
 * 
 * @param {string} resource - The resource name
 * @param {string} action - The action (read, write, delete, manage)
 * @returns {Function} Express middleware
 */
const verifyPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Authentication required' });
    }

    const requiredPermission = `${resource}:${action}`;
    const hasPermission = req.user.permissions.includes(requiredPermission) || 
                          req.user.roles.includes('Admin'); // Admin has all permissions

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Access Denied: Missing permission',
        required: requiredPermission
      });
    }

    next();
  };
};

module.exports = { verifyRole, verifyPermission };
