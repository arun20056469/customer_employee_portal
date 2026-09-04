const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user with roles populated
      const user = await User.findById(decoded.id)
        .populate({
          path: 'roles',
          populate: {
            path: 'permissions'
          }
        });

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      // Attach user and role info to request
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(r => r.name),
        roleIds: user.roles.map(r => r._id),
        permissions: user.roles.reduce((acc, role) => {
          role.permissions.forEach(p => {
            acc.push(`${p.resource}:${p.action}`);
          });
          return acc;
        }, []),
        zohoApps: user.roles.reduce((acc, role) => {
          if (role.zohoApps) {
            acc.push(...role.zohoApps);
          }
          return acc;
        }, [])
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = authenticate;
