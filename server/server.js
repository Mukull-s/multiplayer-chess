require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const routes = require('./routes');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', routes);

// Configure Socket.IO with proper CORS settings
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
});

// Store active games
const games = new Map();
const playerGameMap = new Map();
const playerSockets = new Map();

// Connect to MongoDB
connectDB().then(() => {
    console.log('MongoDB connected successfully');
    
    // Initialize Socket.io after successful DB connection
    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);
        
        // Handle socket events here
        socket.on('createGame', (data) => {
            const gameId = Math.random().toString(36).substring(2, 8);
            const game = new Chess();
            
            games.set(gameId, {
                game,
                players: new Set([socket.id]),
                status: 'waiting',
                createdAt: Date.now()
            });
            
            socket.join(gameId);
            socket.emit('gameCreated', { gameId });
        });
        
        socket.on('joinGame', (data) => {
            const { gameId } = data;
            const game = games.get(gameId);
            
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }
            
            if (game.players.size >= 2) {
                socket.emit('error', { message: 'Game is full' });
                return;
            }
            
            game.players.add(socket.id);
            socket.join(gameId);
            socket.emit('gameJoined', { gameId });
            
            // Notify all players in the room
            io.to(gameId).emit('playerJoined', {
                players: Array.from(game.players)
            });
        });
        
        socket.on('makeMove', (data) => {
            const { gameId, move } = data;
            const game = games.get(gameId);
            
            if (!game) {
                socket.emit('error', { message: 'Game not found' });
                return;
            }
            
            if (!game.players.has(socket.id)) {
                socket.emit('error', { message: 'You are not a player in this game' });
                return;
            }
            
            try {
                const result = game.game.move(move);
                if (result) {
                    // Broadcast the move to all players in the room
                    io.to(gameId).emit('moveMade', {
                        move: result,
                        fen: game.game.fen(),
                        turn: game.game.turn(),
                        isGameOver: game.game.isGameOver()
                    });
                } else {
                    socket.emit('error', { message: 'Invalid move' });
                }
            } catch (error) {
                console.error('Error making move:', error);
                socket.emit('error', { message: 'Failed to make move' });
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Clean up player from all games
            for (const [gameId, gameData] of games.entries()) {
                if (gameData.players.has(socket.id)) {
                    gameData.players.delete(socket.id);
                    io.to(gameId).emit('playerLeft', {
                        playerId: socket.id,
                        players: Array.from(gameData.players)
                    });
                }
            }
        });
    });
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});
