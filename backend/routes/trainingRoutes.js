const express = require('express');
const router = express.Router();
const {
    createTraining,
    getTrainings,
    updateAttendeeStatus
} = require('../controllers/trainingController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, checkRole(['admin', 'ceo', 'manager']), createTraining)
    .get(protect, getTrainings);

router.put('/:id/attendee/:employeeId', protect, checkRole(['admin', 'ceo', 'manager']), updateAttendeeStatus);

module.exports = router;
