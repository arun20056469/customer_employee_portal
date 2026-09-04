const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticate = require('../middlewares/auth');
const { verifyRole } = require('../middlewares/rbac');

// All audit log routes require Admin role
router.use(authenticate);
router.use(verifyRole(['Admin']));

router.get('/', auditController.getLogs);

module.exports = router;
