const express = require('express');
const router = express.Router();
const { getDashboardStats, getAnalytics, seedDemoData } = require('../controllers/dashboardController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/analytics', protect, checkRole(['admin', 'ceo', 'manager', 'hr']), getAnalytics);
router.post('/seed-demo', protect, checkRole(['admin']), seedDemoData);

module.exports = router;
