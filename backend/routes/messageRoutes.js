const express = require('express');
const router = express.Router();
const { sendMessage, sendMessageWithFile, uploadProfilePhoto, getMessages, getConversations, editMessage, deleteMessage, upload } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Text/GIF message
router.route('/')
    .post(protect, sendMessage);

// File upload message
router.post('/upload', protect, upload.single('file'), sendMessageWithFile);

// Profile photo upload (supports file or GIF URL) 
router.post('/profile-photo', protect, upload.single('photo'), uploadProfilePhoto);

// Conversations list
router.get('/conversations', protect, getConversations);

// Edit message
router.put('/:messageId', protect, editMessage);

// Delete message
router.delete('/:messageId', protect, deleteMessage);

// Messages with specific user
router.get('/:otherUserId', protect, getMessages);

module.exports = router;
