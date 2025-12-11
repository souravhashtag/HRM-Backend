const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        const config = {
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            },
        };

        if (process.env.REDIS_PASSWORD) {
            config.password = process.env.REDIS_PASSWORD;
        }

        if (process.env.REDIS_DB) {
            config.database = parseInt(process.env.REDIS_DB, 10);
        }

        redisClient = redis.createClient(config);

        redisClient.on('error', (err) => {
            logger.error('Redis client error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
        });

        redisClient.on('end', () => {
            logger.warn('Redis client disconnected');
        });

        await redisClient.connect();

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await redisClient.quit();
            logger.info('Redis connection closed through app termination');
        });

        return redisClient;
    } catch (error) {
        logger.error('Redis connection failed:', error);
        // Don't exit process - Redis is optional for basic functionality
        return null;
    }
};

const getRedisClient = () => redisClient;

module.exports = {
    connectRedis,
    getRedisClient,
    redisClient,
};
