const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    clientName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'On Hold'],
        default: 'Active',
    },
    billableRate: {
        type: Number,
        default: 0,
    },
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    }],
    budget: {
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
