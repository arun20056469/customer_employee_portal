const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authenticate = require('../middlewares/auth');
const { verifyRole } = require('../middlewares/rbac');

// All role routes require authentication
router.use(authenticate);

// Get permissions list (accessible to all authenticated users)
router.get('/permissions', roleController.getPermissions);

// Get all roles (accessible to all authenticated users for display purposes)
router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);

// Admin-only operations
router.post('/', verifyRole(['Admin']), roleController.createRole);
router.put('/:id', verifyRole(['Admin']), roleController.updateRole);
router.delete('/:id', verifyRole(['Admin']), roleController.deleteRole);
router.put('/:id/permissions', verifyRole(['Admin']), roleController.assignPermissions);

module.exports = router;
