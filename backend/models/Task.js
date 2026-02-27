const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },
    dueDate: {
        type: Date,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
    },
    timeLogged: { // Total time in minutes
        type: Number,
        default: 0
    },
    timeEntries: [{
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number, default: 0 }, // minutes for this entry
        description: String
    }],
    orgId: {
        type: String,
        default: 'default',
    },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
