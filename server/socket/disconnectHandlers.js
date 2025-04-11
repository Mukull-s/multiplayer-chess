const Game = require('../models/Game');
const User = require('../models/User');
const { GAME_EVENTS, GAME_STATUS, GAME_END_REASONS, PLAYER_COLORS } = require('../../shared/socketEvents');

const setupDisconnectHandlers = (io, socket) => {
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

            // Find and update any active games
            const user = await User.findOne({ socketId: socket.id });
            if (user) {
                const activeGames = await Game.find({
                    $or: [
                        { 'whitePlayer.userId': user._id },
                        { 'blackPlayer.userId': user._id }
                    ],
                    status: GAME_STATUS.IN_PROGRESS
                });

                for (const game of activeGames) {
                    // If game is in progress, mark it as abandoned
                    game.status = GAME_STATUS.ABANDONED;
                    game.endedAt = new Date();
                    game.endReason = GAME_END_REASONS.PLAYER_DISCONNECTED;
                    await game.save();

                    // Notify other player
                    const otherPlayerSocketId = game.whitePlayer.userId.toString() === user._id.toString() 
                        ? game.blackPlayer.socketId 
                        : game.whitePlayer.socketId;

                    if (otherPlayerSocketId) {
                        io.to(otherPlayerSocketId).emit(GAME_EVENTS.GAME_OVER, {
                            gameId: game.gameId,
                            winner: game.whitePlayer.userId.toString() === user._id.toString() ? PLAYER_COLORS.BLACK : PLAYER_COLORS.WHITE,
                            reason: GAME_END_REASONS.PLAYER_DISCONNECTED,
                            fen: game.fen
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    });
};

module.exports = { setupDisconnectHandlers }; 