const express = require('express');
const router = express.Router();
const { verifyEmployee } = require('../controllers/publicController');

router.get('/verify/:employeeId', verifyEmployee);

module.exports = router;
