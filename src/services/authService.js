const User = require('../models/User');
const { getRedisClient } = require('../config/redis');
const { generateAccessToken, generateRefreshToken, generateSessionId } = require('../utils/tokenUtils');
const { UnauthorizedError, BadRequestError, ConflictError } = require('../utils/errors');
const { SESSION_EXPIRY_SECONDS, MAX_LOGIN_ATTEMPTS, ACCOUNT_LOCK_DURATION_MINUTES } = require('../config/constants');
const logger = require('../utils/logger');

const authService = {
    login: async ({ username, password, ipAddress }) => {
        // Find user
        const user = await User.findOne({ username }).select('+passwordHash');

        if (!user) {
            throw new UnauthorizedError('Invalid username or password');
        }

        // Check if account is locked
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
            throw new UnauthorizedError('Account is locked. Please try again later.');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            // Increment failed login attempts
            user.failedLoginAttempts += 1;

            // Lock account if max attempts reached
            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MINUTES * 60 * 1000);
            }

            await user.save();
            throw new UnauthorizedError('Invalid username or password');
        }

        // Reset failed login attempts
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        user.lastLogin = new Date();
        await user.save();

        // Generate session
        const sessionId = generateSessionId();
        const accessToken = generateAccessToken(user._id, sessionId);
        const refreshToken = generateRefreshToken(user._id, sessionId);

        // Store session in Redis
        const redisClient = getRedisClient();
        if (redisClient) {
            const sessionKey = `session:${user._id}:${sessionId}`;
            await redisClient.setEx(sessionKey, SESSION_EXPIRY_SECONDS, JSON.stringify({ userId: user._id, sessionId, ipAddress }));
        }

        // Remove password hash from response
        const userObj = user.toObject();
        delete userObj.passwordHash;

        return {
            user: userObj,
            accessToken,
            refreshToken,
            sessionId,
        };
    },

    logout: async (userId, sessionId) => {
        const redisClient = getRedisClient();
        if (redisClient) {
            const sessionKey = `session:${userId}:${sessionId}`;
            await redisClient.del(sessionKey);
        }

        logger.info(`User logged out: ${userId}`);
    },

    refreshToken: async (refreshToken) => {
        // Verify refresh token
        const { verifyRefreshToken } = require('../utils/tokenUtils');
        let decoded;

        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }

        // Check if session exists
        const redisClient = getRedisClient();
        if (redisClient) {
            const sessionKey = `session:${decoded.userId}:${decoded.sessionId}`;
            const sessionExists = await redisClient.exists(sessionKey);

            if (!sessionExists) {
                throw new UnauthorizedError('Session expired');
            }
        }

        // Generate new tokens
        const sessionId = decoded.sessionId;
        const newAccessToken = generateAccessToken(decoded.userId, sessionId);
        const newRefreshToken = generateRefreshToken(decoded.userId, sessionId);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    },
};

module.exports = authService;
