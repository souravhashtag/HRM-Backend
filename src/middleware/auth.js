const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');
const { UnauthorizedError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
    try {
        // 1. Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Access token is required');
        }

        const token = authHeader.split(' ')[1];

        // 2. Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Access token has expired');
            }
            throw new UnauthorizedError('Invalid access token');
        }

        // 3. Check if session exists in Redis (if Redis is available)
        const redisClient = getRedisClient();
        if (redisClient) {
            const sessionKey = `session:${decoded.userId}:${decoded.sessionId}`;
            const sessionExists = await redisClient.exists(sessionKey);
            if (!sessionExists) {
                throw new UnauthorizedError('Session expired. Please login again.');
            }
        }

        // 4. Get user from database
        const user = await User.findById(decoded.userId).select('-passwordHash').lean();

        if (!user) {
            throw new UnauthorizedError('User no longer exists');
        }

        if (!user.isActive) {
            throw new UnauthorizedError('User account has been deactivated');
        }

        // 5. Check if password was changed after token was issued
        if (user.passwordChangedAt) {
            const passwordChangedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
            if (decoded.iat < passwordChangedTimestamp) {
                throw new UnauthorizedError('Password was changed. Please login again.');
            }
        }

        // 6. Attach user to request
        req.user = user;
        req.sessionId = decoded.sessionId;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticate };
