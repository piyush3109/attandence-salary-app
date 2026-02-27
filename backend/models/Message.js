const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        model: {
            type: String,
            required: true,
            enum: ['Admin', 'Employee']
        },
        name: String,
        profilePhoto: String
    },
    receiver: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        model: {
            type: String,
            required: true,
            enum: ['Admin', 'Employee']
        },
        name: String
    },
    content: {
        type: String,
        default: '',
    },
    // Message type: text, image, file, gif, audio
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'gif', 'audio'],
        default: 'text'
    },
    // For image/file attachments
    attachment: {
        url: String,         // Path or URL to the file
        filename: String,    // Original filename
        mimetype: String,    // MIME type
        size: Number         // File size in bytes
    },
    // For GIF messages
    gifUrl: {
        type: String,
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    conversationId: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
