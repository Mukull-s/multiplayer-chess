const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Maintain at least 2 socket connections
            retryWrites: true,
            w: 'majority'
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during disconnection:', err);
                process.exit(1);
            }
        });

        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;     