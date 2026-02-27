const mongoose = require('mongoose');

const connectDB = async () => {
    let dbUrl = process.env.MONGODB_URI;

    const tryConnect = async (url) => {
        try {
            const conn = await mongoose.connect(url, {
                serverSelectionTimeoutMS: 5000,
                autoIndex: true
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return true;
        } catch (error) {
            console.error(`Connection failed to ${url}: ${error.message}`);
            return false;
        }
    };

    let connected = false;
    if (dbUrl) {
        connected = await tryConnect(dbUrl);
    }

    // Only attempt In-Memory fallback in development if MONGODB_URI is missing or fails
    if (!connected && process.env.NODE_ENV === 'development') {
        try {
            console.log('Falling back to In-Memory MongoDB...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            dbUrl = mongod.getUri();
            await tryConnect(dbUrl);
        } catch (err) {
            console.error('Failed to start MongoMemoryServer:', err.message);
            process.exit(1);
        }
    } else if (!connected) {
        console.error('CRITICAL: Could not connect to MongoDB Atlas. Ensure MONGODB_URI is set.');
        process.exit(1);
    }
};

module.exports = connectDB;
