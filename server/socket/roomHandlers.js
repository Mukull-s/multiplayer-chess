const Game = require('../models/Game');
const User = require('../models/User');
const { ROOM_EVENTS, GAME_STATUS, PLAYER_COLORS } = require('../../shared/socketEvents');

const setupRoomHandlers = (io, socket) => {
    // Create a new game room
    socket.on(ROOM_EVENTS.CREATE_ROOM, async ({ userId, timeControl }) => {
        try {
            // Create new game in database
            const game = await Game.create({
                whitePlayer: { userId, socketId: socket.id },
                timeControl,
                status: GAME_STATUS.WAITING,
                roomId: `game_${Date.now()}`,
                gameId: `game_${Date.now()}`,
                moves: [],
                currentTurn: PLAYER_COLORS.WHITE,
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Initial FEN
            });

            // Join the game room
            socket.join(game.roomId);

            // Update user's socket ID and status
            await User.findByIdAndUpdate(userId, {
                socketId: socket.id,
                isOnline: true,
                lastSeen: new Date()
            });

            // Emit game created event
            socket.emit(ROOM_EVENTS.ROOM_CREATED, {
                gameId: game.gameId,
                roomId: game.roomId,
                playerColor: PLAYER_COLORS.WHITE,
                fen: game.fen
            });

        } catch (error) {
            socket.emit(ROOM_EVENTS.ERROR, { message: error.message });
        }
    });

    // Join an existing game room
    socket.on(ROOM_EVENTS.JOIN_ROOM, async ({ gameId, userId }) => {
        try {
            const game = await Game.findOne({ gameId, status: GAME_STATUS.WAITING });
            
            if (!game) {
                socket.emit(ROOM_EVENTS.ERROR, { message: 'Game not found or already started' });
                return;
            }

            if (game.whitePlayer.userId.toString() === userId) {
                socket.emit(ROOM_EVENTS.ERROR, { message: 'You cannot join your own game' });
                return;
            }

            // Update game with black player
            game.blackPlayer = { userId, socketId: socket.id };
            game.status = GAME_STATUS.IN_PROGRESS;
            game.startedAt = new Date();
            await game.save();

            // Join the game room
            socket.join(game.roomId);

            // Update user's socket ID and status
            await User.findByIdAndUpdate(userId, {
                socketId: socket.id,
                isOnline: true,
                lastSeen: new Date()
            });

            // Notify both players
            io.to(game.roomId).emit(ROOM_EVENTS.GAME_STARTED, {
                gameId: game.gameId,
                whitePlayer: game.whitePlayer,
                blackPlayer: game.blackPlayer,
                timeControl: game.timeControl,
                fen: game.fen
            });

        } catch (error) {
            socket.emit(ROOM_EVENTS.ERROR, { message: error.message });
        }
    });
};

module.exports = { setupRoomHandlers }; 