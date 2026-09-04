const express = require('express');
const router = express.Router();
const zohoController = require('../controllers/zohoController');
const authenticate = require('../middlewares/auth');

// All Zoho routes require authentication
router.use(authenticate);

// Get authorized apps for current user
router.get('/apps', zohoController.getAuthorizedApps);

// Proxy requests to Zoho services
router.all('/proxy/:service/*', zohoController.proxyRequest);

module.exports = router;
