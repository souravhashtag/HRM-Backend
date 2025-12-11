const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
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
        checkIn: {
            time: Date,
            location: {
                type: { type: String, default: 'Point' },
                coordinates: [Number], // [longitude, latitude]
            },
            ipAddress: String,
            deviceInfo: String,
        },
        checkOut: {
            time: Date,
            location: {
                type: { type: String, default: 'Point' },
                coordinates: [Number],
            },
            ipAddress: String,
            deviceInfo: String,
        },
        status: {
            type: String,
            enum: Object.values(ATTENDANCE_STATUS),
            default: ATTENDANCE_STATUS.PRESENT,
        },
        totalHours: {
            type: Number,
            default: 0,
        },
        breakTime: {
            type: Number,
            default: 0,
        },
        overtime: {
            type: Number,
            default: 0,
        },
        remarks: String,
        isLate: {
            type: Boolean,
            default: false,
        },
        isEarlyLeave: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for geospatial queries
attendanceSchema.index({ 'checkIn.location': '2dsphere' });
attendanceSchema.index({ 'checkOut.location': '2dsphere' });

// Pre-save hook to calculate total hours
attendanceSchema.pre('save', function (next) {
    if (this.checkIn.time && this.checkOut.time) {
        const checkInTime = new Date(this.checkIn.time);
        const checkOutTime = new Date(this.checkOut.time);
        const diffMs = checkOutTime - checkInTime;
        this.totalHours = Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
    }
    next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
