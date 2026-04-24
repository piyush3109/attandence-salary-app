const Redis = require('ioredis');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback store when Redis is unavailable
const memoryStore = new Map();

const createRedisClient = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn('⚠️  REDIS_URL not set. Using in-memory OTP store (not suitable for production).');
        return null;
    }

    const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Required for Redis Cloud (TLS)
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
        retryStrategy(times) {
            if (times > 5) {
                console.error('❌ Redis: Too many retries. Switching to in-memory fallback.');
                return null; // stop retrying
            }
            return Math.min(times * 200, 2000);
        }
    });

    client.on('connect', () => {
        isRedisConnected = true;
        console.log('✅ Redis Cloud connected successfully');
    });

    client.on('error', (err) => {
        isRedisConnected = false;
        console.error('❌ Redis error:', err.message);
    });

    client.on('close', () => {
        isRedisConnected = false;
    });

    return client;
};

const getRedisClient = () => redisClient;
const isConnected = () => isRedisConnected;

// Universal cache helpers — use Redis if available, else memory fallback
const cacheSet = async (key, value, ttlSeconds = 600) => {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (redisClient && isRedisConnected) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
    } else {
        memoryStore.set(key, {
            value: serialized,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
    }
};

const cacheGet = async (key) => {
    if (redisClient && isRedisConnected) {
        return await redisClient.get(key);
    }
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
    }
    return entry.value;
};

const cacheDel = async (key) => {
    if (redisClient && isRedisConnected) {
        await redisClient.del(key);
    } else {
        memoryStore.delete(key);
    }
};

// Initialize and connect
const connectRedis = async () => {
    redisClient = createRedisClient();
    if (redisClient) {
        try {
            await redisClient.connect();
        } catch (err) {
            console.warn('⚠️  Redis connection failed on startup. Falling back to in-memory store.', err.message);
            isRedisConnected = false;
        }
    }
};

module.exports = { connectRedis, getRedisClient, isConnected, cacheSet, cacheGet, cacheDel };
