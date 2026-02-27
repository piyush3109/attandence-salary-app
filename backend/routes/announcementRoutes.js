const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAnnouncements)
    .post(protect, checkRole(['admin', 'ceo', 'manager']), createAnnouncement);

router.route('/:id')
    .delete(protect, checkRole(['admin', 'ceo', 'manager']), deleteAnnouncement);

module.exports = router;
