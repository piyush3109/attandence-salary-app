const Message = require('../models/Message');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'application/x-rar-compressed',
        'text/plain', 'text/csv',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// @desc    Send a text message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
    try {
        const { receiverId, receiverModel, content, messageType, gifUrl } = req.body;

        let receiver;
        if (receiverModel === 'Admin') {
            receiver = await Admin.findById(receiverId);
        } else {
            receiver = await Employee.findById(receiverId);
        }

        if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

        const senderUser = req.user.role === 'employee'
            ? await Employee.findById(req.user._id)
            : await Admin.findById(req.user._id);

        const messageData = {
            sender: {
                id: req.user._id,
                model: req.user.role === 'employee' ? 'Employee' : 'Admin',
                name: req.user.name || req.user.username,
                profilePhoto: senderUser?.profilePhoto || ''
            },
            receiver: {
                id: receiverId,
                model: receiverModel,
                name: receiver.name || receiver.username
            },
            content: content || '',
            messageType: messageType || 'text',
            conversationId: [req.user._id, receiverId].sort().join('_')
        };

        // Handle GIF messages
        if (messageType === 'gif' && gifUrl) {
            messageData.gifUrl = gifUrl;
        }

        const message = await Message.create(messageData);

        // Emit notification to receiver
        const io = req.app.get('io');
        if (io) {
            io.emit('notification', {
                type: 'message',
                title: `💬 ${messageData.sender.name}`,
                message: messageType === 'gif' ? 'Sent a GIF' : (content || 'Sent a message'),
                priority: 'low',
                receiverId: receiverId,
                senderId: req.user._id,
            });
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Send a message with file attachment
// @route   POST /api/messages/upload
const sendMessageWithFile = async (req, res) => {
    try {
        const { receiverId, receiverModel, content } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        let receiver;
        if (receiverModel === 'Admin') {
            receiver = await Admin.findById(receiverId);
        } else {
            receiver = await Employee.findById(receiverId);
        }

        if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

        const senderUser = req.user.role === 'employee'
            ? await Employee.findById(req.user._id)
            : await Admin.findById(req.user._id);

        const isImage = file.mimetype.startsWith('image/');
        const isAudio = file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/webm'); // some browsers record audio via MediaRecorder as video/webm
        let msgType = 'file';
        if (isImage) msgType = 'image';
        if (isAudio) msgType = 'audio';

        const message = await Message.create({
            sender: {
                id: req.user._id,
                model: req.user.role === 'employee' ? 'Employee' : 'Admin',
                name: req.user.name || req.user.username,
                profilePhoto: senderUser?.profilePhoto || ''
            },
            receiver: {
                id: receiverId,
                model: receiverModel,
                name: receiver.name || receiver.username
            },
            content: content || '',
            messageType: msgType,
            attachment: {
                url: `/uploads/${file.filename}`,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            },
            conversationId: [req.user._id, receiverId].sort().join('_')
        });

        // Emit notification to receiver
        const io = req.app.get('io');
        if (io) {
            io.emit('notification', {
                type: 'message',
                title: `💬 ${req.user.name || req.user.username}`,
                message: isImage ? 'Sent an image' : `Sent a file: ${file.originalname}`,
                priority: 'low',
                receiverId: receiverId,
                senderId: req.user._id,
            });
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Upload profile photo
// @route   POST /api/messages/profile-photo
const uploadProfilePhoto = async (req, res) => {
    try {
        const file = req.file;
        const { gifUrl } = req.body;

        let photoUrl = '';

        if (gifUrl) {
            // Using a GIF URL as profile photo
            photoUrl = gifUrl;
        } else if (file) {
            photoUrl = `/uploads/${file.filename}`;
        } else {
            return res.status(400).json({ message: 'No file or GIF URL provided' });
        }

        if (req.user.role === 'employee') {
            await Employee.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });
        } else {
            await Admin.findByIdAndUpdate(req.user._id, { profilePhoto: photoUrl });
        }

        res.json({ profilePhoto: photoUrl, message: 'Profile photo updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:otherUserId
const getMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const conversationId = [req.user._id, otherUserId].sort().join('_');

        const messages = await Message.find({ conversationId }).sort('createdAt');

        // Mark these messages as read if receiver is current user
        await Message.updateMany(
            { conversationId, 'receiver.id': req.user._id, isRead: false },
            { isRead: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get list of conversations for current user
// @route   GET /api/messages/conversations
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [
                { 'sender.id': userId },
                { 'receiver.id': userId }
            ]
        }).sort('-createdAt');

        const conversations = [];
        const seenConversations = new Set();

        messages.forEach(msg => {
            if (!seenConversations.has(msg.conversationId)) {
                seenConversations.add(msg.conversationId);
                const otherUser = msg.sender.id.toString() === userId.toString() ? msg.receiver : msg.sender;

                let lastMessagePreview = msg.content;
                if (msg.messageType === 'image') lastMessagePreview = '📷 Image';
                else if (msg.messageType === 'file') lastMessagePreview = `📎 ${msg.attachment?.filename || 'File'}`;
                else if (msg.messageType === 'gif') lastMessagePreview = '🎬 GIF';

                conversations.push({
                    conversationId: msg.conversationId,
                    otherUser,
                    lastMessage: lastMessagePreview,
                    updatedAt: msg.updatedAt,
                    isRead: msg.sender.id.toString() === userId.toString() ? true : msg.isRead
                });
            }
        });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Edit a message (only sender can edit, within 15 min)
// @route   PUT /api/messages/:messageId
const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content cannot be empty' });
        }

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Only sender can edit
        if (message.sender.id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own messages' });
        }

        // Only text messages can be edited
        if (message.messageType !== 'text') {
            return res.status(400).json({ message: 'Only text messages can be edited' });
        }

        // 15 minute edit window
        const minutesSinceCreated = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60);
        if (minutesSinceCreated > 15) {
            return res.status(400).json({ message: 'Messages can only be edited within 15 minutes' });
        }

        message.content = content.trim();
        message.isEdited = true;
        await message.save();

        // Emit edit event via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('message_edited', {
                messageId: message._id,
                conversationId: message.conversationId,
                content: message.content,
            });
        }

        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a message (only sender can delete)
// @route   DELETE /api/messages/:messageId
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Only sender can delete
        if (message.sender.id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        await Message.findByIdAndDelete(messageId);

        // Emit delete event via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('message_deleted', {
                messageId: message._id,
                conversationId: message.conversationId,
            });
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { sendMessage, sendMessageWithFile, uploadProfilePhoto, getMessages, getConversations, editMessage, deleteMessage, upload };
