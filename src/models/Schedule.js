const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        shiftType: {
            type: String,
            enum: ['day', 'night', 'afternoon', 'flexible'],
            default: 'day',
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        location: String,
        department: String,
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        notes: String,
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurrencePattern: {
            frequency: {
                type: String,
                enum: ['daily', 'weekly', 'monthly'],
            },
            endsOn: Date,
            daysOfWeek: [String],
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for employee and date
scheduleSchema.index({ employeeId: 1, date: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
