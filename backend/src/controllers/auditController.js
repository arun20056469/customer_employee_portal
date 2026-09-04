const { getAuditLogs } = require('../services/auditService');

/**
 * GET /api/audit-logs
 * Get paginated audit logs with filtering (Admin only)
 */
exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.resource) filters.resource = req.query.resource;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const result = await getAuditLogs(filters, page, limit);

    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
