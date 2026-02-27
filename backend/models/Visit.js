const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    clientName: {
        type: String,
        required: true
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number], // [lng, lat]
        address: String
    },
    purpose: String,
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: Date,
    notes: String,
    photos: [String],
    status: { type: String, enum: ['Scheduled', 'Ongoing', 'Completed'], default: 'Scheduled' }
}, { timestamps: true });

visitSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Visit', visitSchema);
