const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');

// Game routes
router.post('/create', authMiddleware, gameController.createGame);
router.post('/join', authMiddleware, gameController.joinGame);
router.get('/:gameId', authMiddleware, gameController.getGame);
router.post('/move', authMiddleware, gameController.makeMove);
router.post('/resign', authMiddleware, gameController.resignGame);
router.post('/offer-draw', authMiddleware, gameController.offerDraw);
router.post('/accept-draw', authMiddleware, gameController.acceptDraw);
router.get('/active', authMiddleware, gameController.getActiveGames);
router.get('/history', authMiddleware, gameController.getGameHistory);

module.exports = router; 