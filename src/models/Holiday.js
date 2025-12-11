const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['public', 'optional', 'regional'],
            default: 'public',
        },
        description: String,
        location: {
            type: String,
            default: 'All',
        },
        year: {
            type: Number,
            required: true,
            index: true,
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
holidaySchema.index({ year: 1, date: 1 });
holidaySchema.index({ location: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday;
