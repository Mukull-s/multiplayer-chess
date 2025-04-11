require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const routes = require('./routes');
const { initializeSocket } = require('./socket');

// Create Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB().then(() => {
    // Initialize Socket.io after successful DB connection
    const io = initializeSocket(server);

    // Middleware
    app.use(cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.use('/api', routes);

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            error: 'Something went wrong!',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
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
