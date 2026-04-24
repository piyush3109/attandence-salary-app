const Message = require('../models/Message');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const Group = require('../models/Group');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'application/x-rar-compressed',
        'text/plain', 'text/csv',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not supported`), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

// --------------------------------------------------------------------------
// Helper: build sender/receiver objects
// --------------------------------------------------------------------------
const buildParticipant = async (req) => {
    const senderUser = req.user.role === 'employee'
        ? await Employee.findById(req.user._id)
        : await Admin.findById(req.user._id);

    return {
        sender: {
            id: req.user._id,
            model: req.user.role === 'employee' ? 'Employee' : 'Admin',
            name: senderUser?.name || senderUser?.username || req.user.name || req.user.username,
            profilePhoto: senderUser?.profilePhoto || ''
        }
    };
};

const findReceiver = async (receiverId, receiverModel) => {
    if (receiverModel === 'Admin') return await Admin.findById(receiverId);
    if (receiverModel === 'Employee') return await Employee.findById(receiverId);
    if (receiverModel === 'Group') return await Group.findById(receiverId);
    return null;
};

const emitNotification = (io, receiverId, senderId, senderName, msgContent, msgType) => {
    if (!io) return;
    let preview = msgType === 'gif' ? 'Sent a GIF' :
        msgType === 'image' ? 'Sent a photo 📷' :
            msgType === 'audio' ? 'Sent a voice note 🎙️' :
                msgType === 'file' ? 'Sent a file 📎' :
                    (msgContent || 'Sent a message');

    io.emit('notification', {
        type: 'message',
        title: `💬 ${senderName}`,
        message: preview.length > 60 ? preview.slice(0, 60) + '…' : preview,
        priority: 'low',
        receiverId: receiverId.toString(),
        senderId: senderId.toString(),
    });
};

// --------------------------------------------------------------------------
// POST /api/messages  — Send text/GIF message
// --------------------------------------------------------------------------
const sendMessage = async (req, res) => {
    try {
        const { receiverId, receiverModel, content, messageType, gifUrl, replyToId } = req.body;

        const receiver = await findReceiver(receiverId, receiverModel);
        if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

        const { sender } = await buildParticipant(req);
        const conversationId = receiverModel === 'Group' 
            ? receiverId.toString() 
            : [req.user._id.toString(), receiverId.toString()].sort().join('_');

        const messageData = {
            sender,
            receiver: {
                id: receiverId,
                model: receiverModel,
                name: receiver.name || receiver.username
            },
            content: content || '',
            messageType: messageType || 'text',
            conversationId
        };

        if (messageType === 'gif' && gifUrl) messageData.gifUrl = gifUrl;

        // Handle reply-to
        if (replyToId) {
            const original = await Message.findById(replyToId);
            if (original) {
                const preview = original.content
                    ? original.content.slice(0, 100)
                    : original.messageType === 'image' ? '📷 Photo'
                        : original.messageType === 'audio' ? '🎙️ Voice note'
                            : original.messageType === 'gif' ? '🎬 GIF'
                                : original.messageType === 'file' ? `📎 ${original.attachment?.filename || 'File'}`
                                    : '';
                messageData.replyTo = {
                    messageId: original._id,
                    senderName: original.sender.name,
                    contentPreview: preview,
                    messageType: original.messageType
                };
            }
        }

        const message = await Message.create(messageData);

        const io = req.app.get('io');
        emitNotification(io, receiverId, req.user._id, sender.name, message.content, message.messageType);

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/messages/upload  — Send message with file attachment
// --------------------------------------------------------------------------
const sendMessageWithFile = async (req, res) => {
    try {
        const { receiverId, receiverModel, content, replyToId } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        const receiver = await findReceiver(receiverId, receiverModel);
        if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

        const { sender } = await buildParticipant(req);
        const conversationId = receiverModel === 'Group' 
            ? receiverId.toString() 
            : [req.user._id.toString(), receiverId.toString()].sort().join('_');

        const isImage = file.mimetype.startsWith('image/');
        const isAudio = file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm';
        const msgType = isImage ? 'image' : isAudio ? 'audio' : 'file';

        const messageData = {
            sender,
            receiver: { id: receiverId, model: receiverModel, name: receiver.name || receiver.username },
            content: content || '',
            messageType: msgType,
            attachment: {
                url: `/uploads/${file.filename}`,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            },
            conversationId
        };

        if (replyToId) {
            const original = await Message.findById(replyToId);
            if (original) {
                messageData.replyTo = {
                    messageId: original._id,
                    senderName: original.sender.name,
                    contentPreview: original.content?.slice(0, 100) || '',
                    messageType: original.messageType
                };
            }
        }

        const message = await Message.create(messageData);

        const io = req.app.get('io');
        emitNotification(io, receiverId, req.user._id, sender.name, null, msgType);

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/messages/profile-photo
// --------------------------------------------------------------------------
const uploadProfilePhoto = async (req, res) => {
    try {
        const file = req.file;
        const { gifUrl } = req.body;

        let photoUrl = '';
        if (gifUrl) photoUrl = gifUrl;
        else if (file) photoUrl = `/uploads/${file.filename}`;
        else return res.status(400).json({ message: 'No file or GIF URL provided' });

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

// --------------------------------------------------------------------------
// GET /api/messages/:otherUserId  — Get messages in conversation
// --------------------------------------------------------------------------
const getMessages = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        let isGroup = false;

        // Determine if otherUserId is a Group or User. Easy way is if receiverModel is passed, but we don't have it.
        // Let's just check if a Group exists.
        const group = await Group.findById(otherUserId);
        if (group) {
            isGroup = true;
        }

        const conversationId = isGroup 
            ? otherUserId.toString() 
            : [req.user._id.toString(), otherUserId.toString()].sort().join('_');

        const messages = await Message.find({ conversationId, isDeleted: { $ne: true } }).sort('createdAt');

        // Mark as read
        await Message.updateMany(
            { conversationId, 'receiver.id': req.user._id, isRead: false },
            { isRead: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// GET /api/messages/conversations — Get conversation list
// --------------------------------------------------------------------------
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find groups where this user is a member or admin
        const userGroups = await Group.find({
            $or: [
                { 'admin.id': userId },
                { 'members.id': userId }
            ]
        }).select('_id');
        const groupIds = userGroups.map(g => g._id);

        const messages = await Message.find({
            $or: [
                { 'sender.id': userId }, 
                { 'receiver.id': userId },
                { 'receiver.id': { $in: groupIds } }
            ],
            isDeleted: { $ne: true }
        }).sort('-createdAt');

        const conversations = [];
        const seenConversations = new Set();

        messages.forEach(msg => {
            if (!seenConversations.has(msg.conversationId)) {
                seenConversations.add(msg.conversationId);
                let otherUser;
                
                if (msg.receiver.model === 'Group') {
                    otherUser = {
                        id: msg.receiver.id,
                        name: msg.receiver.name,
                        model: 'Group',
                        profilePhoto: ''
                    };
                } else {
                    otherUser = msg.sender.id.toString() === userId.toString() ? msg.receiver : msg.sender;
                }

                let lastMessagePreview = msg.content;
                if (msg.messageType === 'image') lastMessagePreview = '📷 Image';
                else if (msg.messageType === 'file') lastMessagePreview = `📎 ${msg.attachment?.filename || 'File'}`;
                else if (msg.messageType === 'gif') lastMessagePreview = '🎬 GIF';
                else if (msg.messageType === 'audio') lastMessagePreview = '🎙️ Voice note';

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

// --------------------------------------------------------------------------
// PUT /api/messages/:messageId  — Edit a message (within 15 min)
// --------------------------------------------------------------------------
const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content cannot be empty' });
        }

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.isDeleted) return res.status(404).json({ message: 'Message was deleted' });

        if (message.sender.id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own messages' });
        }

        const minutesSinceCreated = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60);
        if (minutesSinceCreated > 15) {
            return res.status(400).json({ message: 'Messages can only be edited within 15 minutes of sending' });
        }

        if (message.messageType !== 'text') {
            return res.status(400).json({ message: 'Only text messages can be edited' });
        }

        message.content = content.trim();
        message.isEdited = true;
        await message.save();

        const io = req.app.get('io');
        if (io) {
            io.to(message.conversationId).emit('message_edited', {
                messageId: message._id,
                conversationId: message.conversationId,
                content: message.content,
                isEdited: true
            });
        }

        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// DELETE /api/messages/:messageId  — Soft-delete a message
// --------------------------------------------------------------------------
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (message.sender.id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own messages' });
        }

        // Soft-delete: mark as deleted so reply-previews still display "Deleted message"
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted.';
        await message.save();

        const io = req.app.get('io');
        if (io) {
            io.to(message.conversationId).emit('message_deleted', {
                messageId: message._id,
                conversationId: message.conversationId
            });
        }

        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// GET /api/messages/search?q=...  — Search messages in a conversation
// --------------------------------------------------------------------------
const searchMessages = async (req, res) => {
    try {
        const { q, otherUserId } = req.query;
        if (!q || !otherUserId) return res.status(400).json({ message: 'Query and otherUserId required' });

        const conversationId = [req.user._id.toString(), otherUserId.toString()].sort().join('_');

        const messages = await Message.find({
            conversationId,
            isDeleted: { $ne: true },
            content: { $regex: q, $options: 'i' }
        }).sort('-createdAt').limit(20);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    sendMessageWithFile,
    uploadProfilePhoto,
    getMessages,
    getConversations,
    editMessage,
    deleteMessage,
    searchMessages,
    upload
};
