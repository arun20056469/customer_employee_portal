const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middlewares/auth');
const { verifyRole } = require('../middlewares/rbac');

// All user routes require authentication and Admin role
router.use(authenticate);
router.use(verifyRole(['Admin']));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.put('/:id/roles', userController.assignRoles);

module.exports = router;
