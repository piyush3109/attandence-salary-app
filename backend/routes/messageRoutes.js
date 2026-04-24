const express = require('express');
const router = express.Router();
const {
    sendMessage,
    sendMessageWithFile,
    uploadProfilePhoto,
    getMessages,
    getConversations,
    editMessage,
    deleteMessage,
    searchMessages,
    upload
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Text/GIF message (supports replyToId in body)
router.post('/', protect, sendMessage);

// File upload message (supports replyToId in body)
router.post('/upload', protect, upload.single('file'), sendMessageWithFile);

// Profile photo upload (supports file or GIF URL)
router.post('/profile-photo', protect, upload.single('photo'), uploadProfilePhoto);

// Conversations list
router.get('/conversations', protect, getConversations);

// Search messages
router.get('/search', protect, searchMessages);

// Edit message (within 15 min)
router.put('/:messageId', protect, editMessage);

// Delete message (soft-delete)
router.delete('/:messageId', protect, deleteMessage);

// Messages with specific user
router.get('/:otherUserId', protect, getMessages);

module.exports = router;
