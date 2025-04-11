const express = require('express');
const router = express.Router();

// In-memory game storage (since we don't need persistence for this demo)
const games = new Map();

// Create a new game
router.post('/create', (req, res) => {
  try {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const game = {
      id: gameId,
      status: 'waiting',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: [],
      players: {
        white: null,
        black: null
      }
    };
    
    games.set(gameId, game);
    res.json({ gameId });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join an existing game
router.post('/:gameId/join', (req, res) => {
  try {
    const gameId = req.params.gameId;
    const game = games.get(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is already in progress' });
    }
    
    // Assign player to black if white is taken, otherwise to white
    if (!game.players.white) {
      game.players.white = { id: Math.random().toString(36).substr(2, 9) };
    } else if (!game.players.black) {
      game.players.black = { id: Math.random().toString(36).substr(2, 9) };
      game.status = 'in_progress';
    }
    
    res.json({ 
      success: true,
      color: game.players.black ? 'black' : 'white',
      gameState: game
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Get game state
router.get('/:gameId', (req, res) => {
  try {
    const gameId = req.params.gameId;
    const game = games.get(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// Make a move
router.post('/:gameId/move', (req, res) => {
  try {
    const gameId = req.params.gameId;
    const { from, to, promotion } = req.body;
    const game = games.get(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (game.status !== 'in_progress') {
      return res.status(400).json({ error: 'Game is not in progress' });
    }
    
    // Add move to game history
    game.moves.push({ from, to, promotion });
    
    // Update FEN (in a real app, you'd validate the move with chess.js)
    // For now, we'll just store the move and let the frontend handle validation
    
    res.json({ success: true, gameState: game });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

module.exports = router; 