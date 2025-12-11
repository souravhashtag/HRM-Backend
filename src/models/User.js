const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, EMPLOYMENT_TYPES, DEFAULT_LEAVE_BALANCE } = require('../config/constants');

const userSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: [true, 'Employee ID is required'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [50, 'Username cannot exceed 50 characters'],
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        personalInfo: {
            firstName: {
                type: String,
                required: [true, 'First name is required'],
                trim: true,
                maxlength: [50, 'First name cannot exceed 50 characters'],
            },
            lastName: {
                type: String,
                required: [true, 'Last name is required'],
                trim: true,
                maxlength: [50, 'Last name cannot exceed 50 characters'],
            },
            email: {
                type: String,
                required: [true, 'Email is required'],
                unique: true,
                lowercase: true,
                trim: true,
                match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
            },
            phone: {
                type: String,
                trim: true,
            },
            dateOfBirth: Date,
            address: {
                street: String,
                city: String,
                state: String,
                country: String,
                zipCode: String,
            },
            emergencyContact: {
                name: String,
                relationship: String,
                phone: String,
            },
        },
        employment: {
            role: {
                type: String,
                enum: {
                    values: Object.values(USER_ROLES),
                    message: '{VALUE} is not a valid role',
                },
                default: USER_ROLES.EMPLOYEE,
            },
            department: String,
            designation: String,
            dateOfJoining: Date,
            employmentType: {
                type: String,
                enum: Object.values(EMPLOYMENT_TYPES),
                default: EMPLOYMENT_TYPES.FULL_TIME,
            },
            reportingManager: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            location: String,
            workingHours: {
                startTime: String,
                endTime: String,
                weeklyOff: [String],
            },
        },
        permissions: {
            modules: [String],
            canApproveLeave: { type: Boolean, default: false },
            canApproveReimbursement: { type: Boolean, default: false },
            canManageSchedule: { type: Boolean, default: false },
            canViewReports: { type: Boolean, default: false },
        },
        allowedIPs: [String],
        leaveBalance: {
            casual: { type: Number, default: DEFAULT_LEAVE_BALANCE.casual },
            sick: { type: Number, default: DEFAULT_LEAVE_BALANCE.sick },
            earned: { type: Number, default: DEFAULT_LEAVE_BALANCE.earned },
            compOff: { type: Number, default: DEFAULT_LEAVE_BALANCE.compOff },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: Date,
        passwordChangedAt: Date,
        failedLoginAttempts: { type: Number, default: 0 },
        accountLockedUntil: Date,
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.passwordHash;
                delete ret.__v;
                ret.id = ret._id;
                delete ret._id;
                return ret;
            },
        },
    }
);

// Indexes
userSchema.index({ employeeId: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'personalInfo.email': 1 }, { unique: true });
userSchema.index({ isActive: 1, 'employment.role': 1 });
userSchema.index({ 'employment.department': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    this.passwordChangedAt = new Date();
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return jwtTimestamp < changedTimestamp;
    }
    return false;
};

// Static method for finding active users
userSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
