require('dotenv').config();

const config = {
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    clientUrl: process.env.CLIENT_URL,
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is required`);
    }
}

module.exports = config; 