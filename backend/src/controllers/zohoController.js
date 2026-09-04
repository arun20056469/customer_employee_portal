const { getAuthorizedApps, proxyToZoho } = require('../services/zohoService');
const { createAuditLog } = require('../services/auditService');

/**
 * GET /api/zoho/apps
 * Get list of Zoho apps the current user is authorized to access
 */
exports.getAuthorizedApps = async (req, res) => {
  try {
    const apps = getAuthorizedApps(req.user.roles);

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'VIEW_ZOHO_APPS',
      resource: 'zoho',
      details: { apps: apps.map(a => a.name) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      apps,
      roles: req.user.roles
    });
  } catch (error) {
    console.error('Get authorized apps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * ALL /api/zoho/proxy/:service/*
 * Proxy requests to the correct Zoho service
 * Only allows access if user's role permits the target service
 */
exports.proxyRequest = async (req, res) => {
  try {
    const { service } = req.params;
    const path = req.params[0] || '';

    // Check if user has access to this Zoho service
    const authorizedApps = getAuthorizedApps(req.user.roles);
    const hasAccess = authorizedApps.some(app => app.serviceKey === service);

    if (!hasAccess) {
      await createAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        action: 'ZOHO_ACCESS_DENIED',
        resource: 'zoho',
        details: { service, path },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failure'
      });

      return res.status(403).json({
        message: `Access denied: You do not have permission to access Zoho ${service}`
      });
    }

    // Proxy the request to Zoho
    const data = await proxyToZoho(service, path, req.method, req.body);

    // Audit log
    await createAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      action: 'ZOHO_API_REQUEST',
      resource: 'zoho',
      details: { service, path, method: req.method },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json(data);
  } catch (error) {
    console.error('Zoho proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Failed to proxy request to Zoho',
      error: error.response?.data || error.message
    });
  }
};
