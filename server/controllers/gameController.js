const Game = require('../models/Game');
const User = require('../models/User');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

// Create a new game
const createGame = async (req, res) => {
    try {
        const { userId, timeControl } = req.body;

        // Validate time control
        const validTimeControls = {
            blitz: { initialTime: 300000, increment: 0 }, // 5 minutes
            rapid: { initialTime: 600000, increment: 0 }, // 10 minutes
            classical: { initialTime: 1800000, increment: 0 }, // 30 minutes
        };

        if (!validTimeControls[timeControl]) {
            return res.status(400).json({ error: 'Invalid time control' });
        }

        // Create new game without requiring a user
        const game = new Game({
            gameId: uuidv4(),
            roomId: uuidv4(),
            whitePlayer: {
                userId: userId || 'default-user',
                username: 'Player 1',
                color: 'white',
                timeLeft: validTimeControls[timeControl].initialTime,
                rating: 1200,
            },
            timeControl: {
                type: timeControl,
                initialTime: validTimeControls[timeControl].initialTime,
                increment: validTimeControls[timeControl].increment,
            },
            status: 'waiting',
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        });

        await game.save();
        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Join an existing game
const joinGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const { userId } = req.body;

        console.log('Attempting to join game:', gameId);
        console.log('User ID:', userId);

        // Find the game
        const game = await Game.findOne({ gameId });
        console.log('Game found:', game ? 'Yes' : 'No');

        if (!game) {
            console.log('Game not found in database');
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.status !== 'waiting') {
            return res.status(400).json({ error: 'Game is not available to join' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is trying to join their own game
        if (game.whitePlayer.userId.toString() === userId) {
            return res.status(400).json({ error: 'Cannot join your own game' });
        }

        // Update game with black player
        game.blackPlayer = {
            userId: user._id,
            username: user.username,
            color: 'black',
            timeLeft: game.timeControl ? game.timeControl.initialTime : null,
            rating: user.stats.rating,
        };
        game.status = 'in-progress';
        game.startedAt = new Date();

        await game.save();

        // Notify both players through socket
        const io = req.app.get('io');
        io.to(game.roomId).emit('gameStarted', {
            gameId: game.gameId,
            whitePlayer: game.whitePlayer,
            blackPlayer: game.blackPlayer,
            timeControl: game.timeControl,
            fen: game.fen
        });

        res.json({
            gameId: game.gameId,
            roomId: game.roomId,
            playerColor: 'black',
            fen: game.fen,
            whitePlayer: game.whitePlayer,
            blackPlayer: game.blackPlayer
        });
    } catch (error) {
        console.error('Error joining game:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get game state
const getGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const userId = req.user._id; // Get user ID from authenticated request

        console.log('Attempting to get game:', gameId);
        console.log('Requested by user:', userId);

        const game = await Game.findOne({ gameId });
        
        if (!game) {
            console.log('Game not found in database');
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check if user is part of the game
        const isWhitePlayer = game.whitePlayer && game.whitePlayer.userId.toString() === userId;
        const isBlackPlayer = game.blackPlayer && game.blackPlayer.userId.toString() === userId;

        if (!isWhitePlayer && !isBlackPlayer) {
            console.log('User not authorized to view this game');
            return res.status(403).json({ error: 'Not authorized to view this game' });
        }

        console.log('Game found and user authorized');
        res.json(game);
    } catch (error) {
        console.error('Error getting game:', error);
        res.status(500).json({ error: error.message });
    }
};

// Make a move
const makeMove = async (req, res) => {
    try {
        const { gameId, userId, from, to, promotion } = req.body;

        const game = await Game.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Validate game state
        if (game.status !== 'in-progress') {
            return res.status(400).json({ error: 'Game is not in progress' });
        }

        // Validate player turn
        const currentPlayer = game.currentTurn === 'white' ? game.whitePlayer : game.blackPlayer;
        if (currentPlayer.userId.toString() !== userId) {
            return res.status(400).json({ error: 'Not your turn' });
        }

        // Create chess instance and validate move
        const chess = new Chess(game.fen);
        const move = chess.move({
            from,
            to,
            promotion: promotion || undefined,
        });

        if (!move) {
            return res.status(400).json({ error: 'Invalid move' });
        }

        // Update game state
        game.fen = chess.fen();
        game.pgn = chess.pgn();
        game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
        game.lastMoveAt = new Date();

        // Add move to history
        game.moves.push({
            from,
            to,
            piece: move.piece,
            captured: move.captured,
            promotion: move.promotion,
            timestamp: new Date(),
        });

        // Update captured pieces
        if (move.captured) {
            const capturedColor = move.color === 'w' ? 'black' : 'white';
            game.capturedPieces[capturedColor].push(move.captured);
        }

        // Check for game end conditions
        if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
                game.status = 'checkmate';
                game.result = {
                    winner: move.color === 'w' ? 'white' : 'black',
                    reason: 'checkmate',
                };
            } else if (chess.isDraw()) {
                game.status = 'draw';
                game.result = {
                    winner: 'draw',
                    reason: chess.isStalemate() ? 'stalemate' : 
                           chess.isThreefoldRepetition() ? 'threefold-repetition' :
                           chess.isInsufficientMaterial() ? 'insufficient-material' : '50-move-rule',
                };
            }
            game.endedAt = new Date();
        }

        await game.save();
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Resign game
const resignGame = async (req, res) => {
    try {
        const { gameId } = req.params;
        const userId = req.user._id;

        console.log('Attempting to resign from game:', gameId);
        console.log('User ID:', userId);

        const game = await Game.findOne({ gameId });
        
        if (!game) {
            console.log('Game not found');
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check if user is part of the game
        const isWhitePlayer = game.whitePlayer && game.whitePlayer.userId.toString() === userId;
        const isBlackPlayer = game.blackPlayer && game.blackPlayer.userId.toString() === userId;

        if (!isWhitePlayer && !isBlackPlayer) {
            console.log('User not authorized to resign from this game');
            return res.status(403).json({ error: 'Not authorized to resign from this game' });
        }

        // Update game status
        game.status = 'resigned';
        game.winner = isWhitePlayer ? 'black' : 'white';
        game.endTime = new Date();

        await game.save();

        console.log('Game resigned successfully');
        res.json({ message: 'Game resigned successfully' });
    } catch (error) {
        console.error('Error resigning from game:', error);
        res.status(500).json({ error: error.message });
    }
};

// Offer draw
const offerDraw = async (req, res) => {
    try {
        const { gameId, userId } = req.body;

        const game = await Game.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (game.status !== 'in-progress') {
            return res.status(400).json({ error: 'Game is not in progress' });
        }

        // Add draw offer to game state
        game.drawOffer = {
            from: userId,
            timestamp: new Date(),
        };

        await game.save();
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Accept draw
const acceptDraw = async (req, res) => {
    try {
        const { gameId, userId } = req.body;

        const game = await Game.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        if (!game.drawOffer || game.drawOffer.from === userId) {
            return res.status(400).json({ error: 'No valid draw offer' });
        }

        game.status = 'draw';
        game.result = {
            winner: 'draw',
            reason: 'agreement',
        };
        game.endedAt = new Date();
        game.drawOffer = null;

        await game.save();
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get active games for a user
const getActiveGames = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Getting active games for user:', userId);

        const games = await Game.find({
            $or: [
                { 'whitePlayer.userId': userId },
                { 'blackPlayer.userId': userId }
            ],
            status: 'in-progress'
        }).sort({ createdAt: -1 });

        console.log('Found active games:', games.length);
        res.json(games);
    } catch (error) {
        console.error('Error getting active games:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get game history for a user
const getGameHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Getting game history for user:', userId);

        const games = await Game.find({
            $or: [
                { 'whitePlayer.userId': userId },
                { 'blackPlayer.userId': userId }
            ],
            status: { $in: ['checkmate', 'resigned', 'draw', 'timeout'] }
        }).sort({ endedAt: -1 });

        console.log('Found completed games:', games.length);
        res.json(games);
    } catch (error) {
        console.error('Error getting game history:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createGame,
    joinGame,
    getGame,
    makeMove,
    resignGame,
    offerDraw,
    acceptDraw,
    getActiveGames,
    getGameHistory,
}; 