const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.userName - Name of the user
 * @param {string} params.action - Action performed (e.g., 'LOGIN', 'CREATE_USER')
 * @param {string} params.resource - Resource affected (e.g., 'auth', 'user')
 * @param {Object} params.details - Additional details
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {string} params.status - 'success', 'failure', or 'warning'
 */
async function createAuditLog({ userId, userName, action, resource, details = {}, ipAddress = '', userAgent = '', status = 'success' }) {
  try {
    const log = new AuditLog({
      userId,
      userName,
      action,
      resource,
      details,
      ipAddress,
      userAgent,
      status
    });

    await log.save();
    return log;
  } catch (error) {
    // Don't let audit logging failures break the main flow
    console.error('Failed to create audit log:', error.message);
  }
}

/**
 * Get audit logs with pagination and filtering
 * @param {Object} filters - Query filters
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated audit logs
 */
async function getAuditLogs(filters = {}, page = 1, limit = 20) {
  const query = {};

  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = { $regex: filters.action, $options: 'i' };
  if (filters.resource) query.resource = { $regex: filters.resource, $options: 'i' };
  if (filters.status) query.status = filters.status;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    AuditLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  createAuditLog,
  getAuditLogs
};
