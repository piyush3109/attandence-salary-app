const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByDate, getEmployeeAttendanceHistory, updateAttendanceStatus } = require('../controllers/attendanceController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['admin', 'manager', 'ceo', 'employee']), markAttendance);
router.get('/', protect, checkRole(['admin', 'manager', 'accountant', 'ceo']), getAttendanceByDate);
router.get('/employee/:employeeId', protect, getEmployeeAttendanceHistory);
router.put('/:id/status', protect, checkRole(['admin', 'manager', 'ceo']), updateAttendanceStatus);

module.exports = router;
