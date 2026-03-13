const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    admin: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        model: {
            type: String,
            required: true,
            enum: ['Admin', 'Employee']
        }
    },
    members: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        model: {
            type: String,
            required: true,
            enum: ['Admin', 'Employee']
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        }
    }],
    orgId: {
        type: String,
        default: 'default'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);
