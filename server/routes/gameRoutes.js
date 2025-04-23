const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');

// Create a new game
router.post('/', authMiddleware, gameController.createGame);

// Join a game
router.post('/:gameId/join', authMiddleware, gameController.joinGame);

// Make a move
router.post('/:gameId/move', authMiddleware, gameController.makeMove);

// Get game state
router.get('/:gameId', authMiddleware, gameController.getGame);

// Resign from game
router.post('/:gameId/resign', authMiddleware, gameController.resignGame);

// Get active games
router.get('/user/:userId/active', authMiddleware, gameController.getActiveGames);

// Get game history
router.get('/user/:userId/history', authMiddleware, gameController.getGameHistory);

module.exports = router; 