const Game = require('../models/Game');
const User = require('../models/User');
const { Chess } = require('chess.js');

const ROOM_EVENTS = {
    CREATE_ROOM: 'createRoom',
    JOIN_ROOM: 'joinRoom',
    ROOM_CREATED: 'roomCreated',
    GAME_STARTED: 'gameStarted',
    ERROR: 'error'
};

const GAME_STATUS = {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed'
};

const PLAYER_COLORS = {
    WHITE: 'white',
    BLACK: 'black'
};

const setupRoomHandlers = (io, socket) => {
    // Create a new game room
    socket.on(ROOM_EVENTS.CREATE_ROOM, async ({ userId, timeControl }) => {
        try {
            console.log('Creating room with:', { userId, timeControl });
            
            // Validate time control
            const validTimeControls = {
                blitz: { initialTime: 300000, increment: 3000 },
                rapid: { initialTime: 900000, increment: 10000 },
                classical: { initialTime: 1800000, increment: 0 }
            };

            if (!validTimeControls[timeControl]) {
                throw new Error('Invalid time control');
            }

            // Create new game in database
            const game = new Game({
                whitePlayer: { 
                    userId, 
                    socketId: socket.id,
                    timeLeft: validTimeControls[timeControl].initialTime
                },
                timeControl: {
                    type: timeControl,
                    initialTime: validTimeControls[timeControl].initialTime,
                    increment: validTimeControls[timeControl].increment
                },
                status: GAME_STATUS.WAITING,
                roomId: `game_${Date.now()}`,
                gameId: `game_${Date.now()}`,
                moves: [],
                currentTurn: PLAYER_COLORS.WHITE,
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
            });

            await game.save();
            console.log('Game created:', game.gameId);

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
                fen: game.fen,
                timeControl: game.timeControl
            });

        } catch (error) {
            console.error('Error creating room:', error);
            socket.emit(ROOM_EVENTS.ERROR, { message: error.message });
        }
    });

    // Join an existing game room
    socket.on(ROOM_EVENTS.JOIN_ROOM, async ({ gameId, userId }) => {
        try {
            console.log('Joining room:', { gameId, userId });
            
            const game = await Game.findOne({ gameId, status: GAME_STATUS.WAITING });
            
            if (!game) {
                throw new Error('Game not found or already started');
            }

            if (game.whitePlayer.userId.toString() === userId) {
                throw new Error('You cannot join your own game');
            }

            // Update game with black player
            game.blackPlayer = { 
                userId, 
                socketId: socket.id,
                timeLeft: game.timeControl.initialTime
            };
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
                fen: game.fen,
                currentTurn: game.currentTurn
            });

        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit(ROOM_EVENTS.ERROR, { message: error.message });
        }
    });
};

module.exports = { setupRoomHandlers }; 