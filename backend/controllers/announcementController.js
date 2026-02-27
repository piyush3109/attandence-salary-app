const Announcement = require('../models/Announcement');

// @desc    Get all active announcements
// @route   GET /api/announcements
const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ active: true })
            .populate('publishedBy', 'username role profilePhoto')
            .sort('-createdAt');
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create announcement
// @route   POST /api/announcements
const createAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.create({
            title: req.body.title,
            message: req.body.message,
            priority: req.body.priority || 'medium',
            publishedBy: req.user._id
        });

        // Notify via socket if required
        const io = req.app.get('io');
        if (io) {
            io.emit('new_announcement', announcement);
        }

        res.status(201).json(announcement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete (deactivate) announcement
// @route   DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!announcement) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Announcement removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
