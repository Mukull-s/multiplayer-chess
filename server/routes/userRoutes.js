const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.get('/profile', authMiddleware, userController.getUserProfile);
router.put('/profile', authMiddleware, userController.updateUserProfile);
router.put('/avatar', authMiddleware, userController.updateUserAvatar);
router.get('/stats', authMiddleware, userController.getUserStats);
router.get('/active-games', authMiddleware, userController.getUserActiveGames);
router.get('/completed-games', authMiddleware, userController.getUserCompletedGames);
router.put('/status', authMiddleware, userController.updateUserStatus);
router.get('/online', authMiddleware, userController.getOnlineUsers);
router.get('/search', authMiddleware, userController.searchUsers);

module.exports = router; 