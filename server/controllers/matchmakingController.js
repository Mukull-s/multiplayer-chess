const Game = require('../models/Game');
const { Chess } = require('chess.js');

// Queue for players waiting for a game
const waitingQueue = new Map();

// Match players based on rating
const findMatch = (player) => {
  const ratingRange = 200; // Maximum rating difference for matching
  const minRating = player.rating - ratingRange;
  const maxRating = player.rating + ratingRange;

  for (const [userId, waitingPlayer] of waitingQueue.entries()) {
    if (
      waitingPlayer.rating >= minRating &&
      waitingPlayer.rating <= maxRating &&
      userId !== player.id
    ) {
      // Found a match
      waitingQueue.delete(userId);
      return waitingPlayer;
    }
  }

  return null;
};

// Add player to matchmaking queue
exports.joinQueue = async (req, res) => {
  try {
    const { userId, socketId, rating } = req.body;

    // Check if player is already in queue
    if (waitingQueue.has(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already in queue'
      });
    }

    // Add player to queue
    waitingQueue.set(userId, {
      id: userId,
      socketId,
      rating,
      joinedAt: Date.now()
    });

    // Try to find a match
    const opponent = findMatch({ id: userId, rating });

    if (opponent) {
      // Create new game
      const game = new Game({
        whitePlayer: userId,
        blackPlayer: opponent.id,
        status: 'in-progress',
        fen: new Chess().fen()
      });

      await game.save();

      // Notify both players
      return res.json({
        success: true,
        gameId: game._id,
        opponent: {
          id: opponent.id,
          rating: opponent.rating
        }
      });
    }

    res.json({
      success: true,
      message: 'Waiting for opponent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining queue',
      error: error.message
    });
  }
};

// Remove player from matchmaking queue
exports.leaveQueue = async (req, res) => {
  try {
    const { userId } = req.body;

    if (waitingQueue.has(userId)) {
      waitingQueue.delete(userId);
    }

    res.json({
      success: true,
      message: 'Left queue'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error leaving queue',
      error: error.message
    });
  }
};

// Get queue status
exports.getQueueStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const inQueue = waitingQueue.has(userId);
    const queueSize = waitingQueue.size;

    res.json({
      success: true,
      inQueue,
      queueSize
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting queue status',
      error: error.message
    });
  }
}; 