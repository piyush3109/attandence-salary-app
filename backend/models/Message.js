const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee'] },
        name: String,
        profilePhoto: String
    },
    receiver: {
        id: { type: mongoose.Schema.Types.ObjectId, required: true },
        model: { type: String, required: true, enum: ['Admin', 'Employee', 'Group'] },
        name: String
    },
    content: { type: String, default: '' },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'gif', 'audio'],
        default: 'text'
    },
    attachment: {
        url: String,
        filename: String,
        mimetype: String,
        size: Number
    },
    gifUrl: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },          // soft-delete support
    deletedAt: { type: Date },

    // ── Reply feature ─────────────────────────────────────────────────────
    replyTo: {
        messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        senderName: String,
        contentPreview: String,  // First 100 chars of original message for preview
        messageType: String
    },

    conversationId: { type: String, index: true }
}, { timestamps: true });

// Index for fast conversation lookup
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
