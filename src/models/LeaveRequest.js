const mongoose = require('mongoose');
const { LEAVE_TYPES, LEAVE_STATUS } = require('../config/constants');

const leaveRequestSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        leaveType: {
            type: String,
            enum: Object.values(LEAVE_TYPES),
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalDays: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
        },
        status: {
            type: String,
            enum: Object.values(LEAVE_STATUS),
            default: LEAVE_STATUS.PENDING,
            index: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
        reviewComments: String,
        attachments: [
            {
                fileName: String,
                fileUrl: String,
                uploadedAt: Date,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes
leaveRequestSchema.index({ employeeId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

// Validation: End date must be after start date
leaveRequestSchema.pre('save', function (next) {
    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        next(new Error('End date must be after start date'));
    } else {
        next();
    }
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = LeaveRequest;
