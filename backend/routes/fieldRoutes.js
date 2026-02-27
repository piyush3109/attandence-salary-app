const express = require('express');
const router = express.Router();
const { visitCheckIn, visitCheckOut, getVisits } = require('../controllers/fieldController');
const { protect } = require('../middleware/authMiddleware');

router.get('/visits', protect, getVisits);
router.post('/check-in', protect, visitCheckIn);
router.put('/check-out/:id', protect, visitCheckOut);

module.exports = router;
