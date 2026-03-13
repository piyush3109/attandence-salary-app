const mongoose = require('mongoose');

const connectDB = async () => {
    let dbUrl = process.env.MONGODB_URI;

    const tryConnect = async (url) => {
        try {
            // Mask the URL for logging
            const maskedUrl = url.replace(/\/\/.*:.*@/, '//<user>:<password>@');
            console.log(`Attempting to connect to: ${maskedUrl}`);

            const conn = await mongoose.connect(url, {
                serverSelectionTimeoutMS: 5000,
                autoIndex: true,
                // Default to a specific DB name if not in URI string
                dbName: url.includes('/?') || url.endsWith('.net/') || url.endsWith('.net') ? 'attendance_salary_db' : undefined
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
            return true;
        } catch (error) {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
            if (error.message.includes('authentication failed')) {
                console.error('👉 TIP: Check your database username and password in backend/.env');
            } else if (error.message.includes('IP not whitelisted')) {
                console.error('👉 TIP: Ensure your IP address is whitelisted in MongoDB Atlas Network Access');
            }
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
