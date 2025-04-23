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
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
}));
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
    connectTimeout: 45000,
    path: '/socket.io'
});

// Make io accessible to routes
app.set('io', io);

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
        
        // Handle authentication
        socket.on('authenticate', (token) => {
            // Verify token and set user data
            // This is a placeholder - implement proper token verification
            console.log('Client authenticated:', socket.id);
        });

        // Handle room joining
        socket.on('joinRoom', ({ roomId }) => {
            console.log('Client joining room:', roomId);
            socket.join(roomId);
            io.to(roomId).emit('roomJoined', { roomId, playerId: socket.id });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Clean up game state if needed
        });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Socket.IO server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => process.exit(1));
});
