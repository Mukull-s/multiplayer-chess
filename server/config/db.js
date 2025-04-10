const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        // Set mongoose options
        mongoose.set('strictQuery', true);
        
        // Connect to MongoDB Atlas
        const conn = await mongoose.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });

        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB Atlas');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Mongoose connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected from MongoDB Atlas');
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('Mongoose connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error(`Error during disconnection: ${err}`);
                process.exit(1);
            }
        });

    } catch (error) {
        console.error(`MongoDB Atlas Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 