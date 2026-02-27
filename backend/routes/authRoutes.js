const express = require('express');
const router = express.Router();
const { loginUser, createInitialAdmin, verifyFirebaseUser, updateUserTheme, guestLogin, sendEmailOTP, verifyEmailOTP, registerUser, getAdmins } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/send-otp', sendEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/setup', createInitialAdmin);
router.post('/verify-firebase', verifyFirebaseUser);
router.put('/theme', protect, updateUserTheme);
router.post('/guest-login', guestLogin);
router.get('/admins', protect, getAdmins);

module.exports = router;
