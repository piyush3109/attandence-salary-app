const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    trainer: String,
    startDate: Date,
    endDate: Date,
    status: {
        type: String,
        enum: ['Upcoming', 'In-Progress', 'Completed', 'Cancelled'],
        default: 'Upcoming'
    },
    attendees: [{
        employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        status: { type: String, enum: ['Enrolled', 'Attended', 'Completed', 'Failed'], default: 'Enrolled' },
        score: Number,
        certificateUrl: String
    }],
    skillTaught: String,
    level: String
}, { timestamps: true });

module.exports = mongoose.model('Training', trainingSchema);
