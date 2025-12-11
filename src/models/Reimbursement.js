const mongoose = require('mongoose');
const { REIMBURSEMENT_STATUS } = require('../config/constants');

const reimbursementSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ['travel', 'food', 'accommodation', 'medical', 'equipment', 'other'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount must be positive'],
        },
        currency: {
            type: String,
            default: 'USD',
        },
        date: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        receipts: [
            {
                fileName: String,
                fileUrl: String,
                uploadedAt: Date,
            },
        ],
        status: {
            type: String,
            enum: Object.values(REIMBURSEMENT_STATUS),
            default: REIMBURSEMENT_STATUS.PENDING,
            index: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: Date,
        reviewComments: String,
        paymentDate: Date,
        paymentReference: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
reimbursementSchema.index({ employeeId: 1, status: 1 });
reimbursementSchema.index({ date: 1 });

const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema);

module.exports = Reimbursement;
