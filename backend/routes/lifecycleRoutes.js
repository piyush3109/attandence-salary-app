const express = require('express');
const router = express.Router();
const {
    initiateExit,
    updateChecklist,
    generateExperienceLetter,
    getProbationAlerts
} = require('../controllers/lifecycleController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.get('/probation-alerts', protect, checkRole(['admin', 'ceo', 'manager']), getProbationAlerts);
router.post('/:id/exit', protect, checkRole(['admin', 'ceo', 'manager']), initiateExit);
router.put('/:id/checklist', protect, checkRole(['admin', 'ceo', 'manager']), updateChecklist);
router.get('/:id/experience-letter', protect, checkRole(['admin', 'ceo', 'manager', 'employee']), generateExperienceLetter);

module.exports = router;
