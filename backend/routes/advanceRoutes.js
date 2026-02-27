const express = require('express');
const router = express.Router();
const { addAdvance, getEmployeeAdvances, getAllAdvances, deleteAdvance } = require('../controllers/advanceController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['admin', 'manager']), addAdvance);
router.get('/', protect, checkRole(['admin', 'manager', 'accountant']), getAllAdvances);
router.get('/:employeeId', protect, getEmployeeAdvances);
router.delete('/:id', protect, checkRole(['admin']), deleteAdvance);

module.exports = router;
