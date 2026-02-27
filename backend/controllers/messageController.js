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
            messageType: isImage ? 'image' : 'file',
            attachment: {
                url: `/uploads/${file.filename}`,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            },
            conversationId: [req.user._id, receiverId].sort().join('_')
        });

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

module.exports = { sendMessage, sendMessageWithFile, uploadProfilePhoto, getMessages, getConversations, upload };
