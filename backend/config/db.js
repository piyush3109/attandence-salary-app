const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas or In-Memory fallback
 * Improved for production environments (Vercel)
 */
const connectDB = async () => {
    const dbUrl = process.env.MONGODB_URI;

    const tryConnect = async (url) => {
        try {
            // Mask the URL for safe logging
            const maskedUrl = url.replace(/\/\/.*:.*@/, '//<user>:<password>@');
            console.log(`📡 Connecting to: ${maskedUrl}`);

            // Connection options
            const options = {
                serverSelectionTimeoutMS: 10000, // Reduced timeout for faster failure detection
                autoIndex: true,
            };

            // Only set dbName if the URI doesn't clearly contain one
            // URIs usually look like ...net/database_name?retries...
            // If it's just ...net/ or ...net/?... then we provide a default
            const hasDatabaseName = url.split('/').pop().split('?')[0].length > 0;
            if (!hasDatabaseName) {
                options.dbName = 'attendance_salary_db';
            }

            const conn = await mongoose.connect(url, options);
            console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
            return true;
        } catch (error) {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);

            // Helpful tips for the user in logs
            if (error.message.includes('authentication failed')) {
                console.error('👉 TIP: Check your database username and password in your environment variables.');
                console.error('👉 TIP: Ensure special characters in password are URL encoded.');
            } else if (error.message.includes('IP not whitelisted')) {
                console.error('👉 TIP: Add 0.0.0.0/0 to your MongoDB Atlas Network Access for Vercel compatibility.');
            } else if (error.message.includes('ECONNREFUSED')) {
                console.error('👉 TIP: Check if your database host is correct and your internet connection is stable.');
            }

            return false;
        }
    };

    let connected = false;
    if (dbUrl) {
        connected = await tryConnect(dbUrl);
    }

    // Handlers for connection failure
    if (!connected) {
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log('⚠️ Atlas connection failed. Attempting In-Memory MongoDB for development...');
                // Dynamically require to avoid production build issues
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const mongod = await MongoMemoryServer.create();
                const memUri = mongod.getUri();
                await tryConnect(memUri);
            } catch (err) {
                console.error('CRITICAL: Failed to start MongoMemoryServer:', err.message);
                // In dev, we can exit to notify the developer
                process.exit(1);
            }
        } else {
            // In production, we LOG the error but don't exit(1) immediately.
            // This prevents "status 1" crashes on boot, allowing the developer to see logs.
            // Routes will still fail gracefully when they try to use an unitialized connection.
            console.error('🚨 CRITICAL: Persistent database connection failure.');
            console.error('🚨 The app is starting WITHOUT a database connection. Check MONGODB_URI.');
        }
    }
};

module.exports = connectDB;
