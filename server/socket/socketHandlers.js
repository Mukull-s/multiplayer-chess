const Game = require('../models/Game');
const User = require('../models/User');
const gameController = require('../controllers/gameController');

const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle player joining a game
        socket.on('join-game', async ({ gameId, userId }) => {
            try {
                const game = await Game.findOne({ gameId });
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                // Join the game room
                socket.join(game.roomId);

                // Update user's socket ID
                await User.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    isOnline: true,
                    lastSeen: new Date()
                });

                // Notify other players in the game
                io.to(game.roomId).emit('player-joined', {
                    gameId,
                    playerId: userId
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle making a move
        socket.on('make-move', async ({ gameId, userId, move }) => {
            try {
                const game = await Game.findOne({ gameId });
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                // Validate move and update game state
                const updatedGame = await gameController.makeMove({
                    gameId,
                    userId,
                    ...move
                });

                // Broadcast move to all players in the game
                io.to(game.roomId).emit('move-made', {
                    gameId,
                    move,
                    gameState: updatedGame
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle game chat messages
        socket.on('chat-message', async ({ gameId, userId, message }) => {
            try {
                const game = await Game.findOne({ gameId });
                if (!game) {
                    socket.emit('error', { message: 'Game not found' });
                    return;
                }

                // Broadcast message to all players in the game
                io.to(game.roomId).emit('new-message', {
                    gameId,
                    userId,
                    message,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
            console.log('Client disconnected:', socket.id);
            
            try {
                // Update user's online status
                await User.findOneAndUpdate(
                    { socketId: socket.id },
                    {
                        isOnline: false,
                        lastSeen: new Date()
                    }
                );

                // Notify other players in any games
                const user = await User.findOne({ socketId: socket.id });
                if (user) {
                    const activeGames = await Game.find({
                        $or: [
                            { 'whitePlayer.userId': user._id },
                            { 'blackPlayer.userId': user._id }
                        ],
                        status: 'in-progress'
                    });

                    activeGames.forEach(game => {
                        io.to(game.roomId).emit('player-disconnected', {
                            gameId: game.gameId,
                            playerId: user._id
                        });
                    });
                }
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    });
};

module.exports = { setupSocketHandlers }; 