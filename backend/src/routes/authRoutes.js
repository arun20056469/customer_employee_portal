const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/auth');
const { verifyRole } = require('../middlewares/rbac');

// Public routes
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/register', authenticate, verifyRole(['Admin']), authController.register);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
