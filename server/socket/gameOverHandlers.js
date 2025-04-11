const Game = require('../models/Game');

const setupGameOverHandlers = (io, socket) => {
    // Handle game over (resignation or draw offer)
    socket.on('game-over', async ({ gameId, userId, reason }) => {
        try {
            const game = await Game.findOne({ gameId });
            
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }

            // Determine winner based on who resigned
            const playerColor = game.whitePlayer.userId.toString() === userId ? 'white' : 'black';
            const winner = playerColor === 'white' ? 'black' : 'white';

            // Update game state
            game.status = 'completed';
            game.winner = winner;
            game.endedAt = new Date();
            game.endReason = reason;
            await game.save();

            // Notify both players
            io.to(game.roomId).emit('game-over', {
                gameId: game.gameId,
                winner,
                reason,
                fen: game.fen
            });

        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });
};

module.exports = { setupGameOverHandlers }; 