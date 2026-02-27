const express = require('express');
const router = express.Router();
const { getAIInsights } = require('../controllers/aiController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.get('/insights', protect, checkRole(['admin', 'ceo', 'manager']), getAIInsights);

module.exports = router;
