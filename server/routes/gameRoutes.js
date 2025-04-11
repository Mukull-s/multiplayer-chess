const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Create a new game
router.post('/', gameController.createGame);

// Join a game
router.post('/:gameId/join', gameController.joinGame);

// Make a move
router.post('/:gameId/move', gameController.makeMove);

// Get game state
router.get('/:gameId', gameController.getGame);

// Resign from game
router.post('/:gameId/resign', gameController.resignGame);

// Get active games
router.get('/user/:userId/active', gameController.getActiveGames);

// Get game history
router.get('/user/:userId/history', gameController.getGameHistory);

module.exports = router; 