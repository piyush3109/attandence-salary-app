const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    model: { type: String, required: true, enum: ['Admin', 'Employee'] },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
}, { _id: false });

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    createdBy: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee'] }
    },
    subscribers: [memberSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const pollOptionSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    votes: [{
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee'] }
    }],
    isCorrect: { type: Boolean, default: false }
}, { _id: false });

const postSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['message', 'task', 'reminder', 'event', 'poll'],
        default: 'message'
    },
    channelName: { type: String, default: 'general' },
    content: { type: String, trim: true, default: '' },
    createdBy: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee'] },
        name: String
    },
    taskMeta: {
        dueDate: Date,
        assigneeIds: [mongoose.Schema.Types.ObjectId]
    },
    eventMeta: {
        startsAt: Date,
        location: String
    },
    poll: {
        question: String,
        options: [pollOptionSchema],
        allowMultiple: { type: Boolean, default: false },
        hasCorrectAnswer: { type: Boolean, default: false }
    }
}, { timestamps: true });

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    admin: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee'] }
    },
    groupAdmins: [memberSchema],
    members: [memberSchema],
    blockedUsers: [memberSchema],
    joinRequests: [memberSchema],
    reports: [{
        reporter: memberSchema,
        reason: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
    channels: [channelSchema],
    posts: [postSchema],
    operationsCenterVisibleTo: {
        type: [String],
        enum: ['admin', 'ceo', 'manager', 'employee'],
        default: ['admin', 'ceo', 'manager']
    },
    orgId: { type: String, default: 'default' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);
