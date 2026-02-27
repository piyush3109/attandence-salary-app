const express = require('express');
const router = express.Router();
const { getSalaryReport, getSalarySlip, getMySalaryHistory } = require('../controllers/salaryController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.get('/report', protect, checkRole(['admin', 'ceo', 'manager', 'accountant', 'hr']), getSalaryReport);
router.get('/history', protect, checkRole(['employee']), getMySalaryHistory);
router.get('/slip/:employeeId', protect, getSalarySlip);

module.exports = router;
