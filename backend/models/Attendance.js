const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'],
        required: true,
    },
    workingHours: {
        type: Number,
        default: 0,
    },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    isMockLocation: { type: Boolean, default: false }, // Fraud detection
    orgId: { type: String, default: 'default' }
}, { timestamps: true });

// Prevent duplicate attendance for same employee on same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
