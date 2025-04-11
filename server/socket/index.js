const { Server } = require('socket.io');
const { setupRoomHandlers } = require('./roomHandlers');
const { setupMoveHandlers } = require('./moveHandlers');
const { setupGameOverHandlers } = require('./gameOverHandlers');
const { setupDisconnectHandlers } = require('./disconnectHandlers');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Setup all event handlers
        setupRoomHandlers(io, socket);
        setupMoveHandlers(io, socket);
        setupGameOverHandlers(io, socket);
        setupDisconnectHandlers(io, socket);
    });

    return io;
};

module.exports = { initializeSocket }; 