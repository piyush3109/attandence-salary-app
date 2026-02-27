const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['employee']), applyLeave);
router.get('/my', protect, checkRole(['employee', 'manager']), getMyLeaves);
router.get('/', protect, checkRole(['admin', 'ceo', 'manager', 'hr']), getAllLeaves);
router.put('/:id/status', protect, checkRole(['admin', 'ceo', 'manager', 'hr']), updateLeaveStatus);

module.exports = router;
