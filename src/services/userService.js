const User = require('../models/User');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { hashPassword } = require('../utils/passwordUtils');
const logger = require('../utils/logger');

const userService = {
    getUsers: async ({ page, limit, filters }) => {
        const query = { isActive: true };

        if (filters.role) query['employment.role'] = filters.role;
        if (filters.department) query['employment.department'] = filters.department;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.search) {
            query.$or = [
                { 'personalInfo.firstName': new RegExp(filters.search, 'i') },
                { 'personalInfo.lastName': new RegExp(filters.search, 'i') },
                { 'personalInfo.email': new RegExp(filters.search, 'i') },
                { employeeId: new RegExp(filters.search, 'i') },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-passwordHash')
                .populate('employment.reportingManager', 'personalInfo.firstName personalInfo.lastName')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        return { users, total };
    },

    getUserById: async (id) => {
        const user = await User.findById(id)
            .select('-passwordHash')
            .populate('employment.reportingManager', 'personalInfo.firstName personalInfo.lastName')
            .lean();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user;
    },

    createUser: async (userData) => {
        // Check if user already exists
        const existing = await User.findOne({
            $or: [
                { employeeId: userData.employeeId },
                { username: userData.username },
                { 'personalInfo.email': userData.personalInfo.email },
            ],
        });

        if (existing) {
            throw new ConflictError('User with this email, username, or employee ID already exists');
        }

        // Hash password
        userData.passwordHash = await hashPassword(userData.password);
        delete userData.password;

        // Create user
        const user = await User.create(userData);

        logger.info(`User created: ${user.employeeId}`);

        return user;
    },

    updateUser: async (id, updateData) => {
        // Remove fields that shouldn't be updated directly
        delete updateData.passwordHash;
        delete updateData.password;
        delete updateData.employeeId;

        const user = await User.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date(),
            },
            {
                new: true,
                runValidators: true,
            }
        ).select('-passwordHash');

        if (!user) {
            throw new NotFoundError('User not found');
        }

        logger.info(`User updated: ${user.employeeId}`);

        return user;
    },

    deactivateUser: async (id) => {
        const user = await User.findByIdAndUpdate(
            id,
            {
                isActive: false,
            },
            { new: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        logger.info(`User deactivated: ${user.employeeId}`);

        return user;
    },
};

module.exports = userService;
