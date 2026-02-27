const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByDate, getEmployeeAttendanceHistory } = require('../controllers/attendanceController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['admin', 'manager']), markAttendance);
router.get('/', protect, checkRole(['admin', 'manager', 'accountant']), getAttendanceByDate);
router.get('/employee/:employeeId', protect, getEmployeeAttendanceHistory);

module.exports = router;
