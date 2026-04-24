const express = require('express');
const router = express.Router();
const {
    loginUser,
    logoutUser,
    createInitialAdmin,
    verifyFirebaseUser,
    updateUserTheme,
    guestLogin,
    sendEmailOTP,
    verifyEmailOTP,
    registerUser,
    getAdmins,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    changePassword,
    updateUserRole,
    getMe
} = require('../controllers/authController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// ── Public routes ──────────────────────────────────────────────────────────
router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/send-otp', sendEmailOTP);
router.post('/verify-otp', verifyEmailOTP);
router.post('/setup', createInitialAdmin);
router.post('/verify-firebase', verifyFirebaseUser);
router.post('/guest-login', guestLogin);

// ── Password reset (public — user is not authenticated yet) ───────────────
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// ── Protected routes ───────────────────────────────────────────────────────
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.put('/theme', protect, updateUserTheme);
router.put('/change-password', protect, changePassword);
router.get('/admins', protect, getAdmins);

// ── Admin-only: update any user's role ─────────────────────────────────────
router.put('/update-role/:userId', protect, checkRole(['admin', 'ceo']), updateUserRole);

module.exports = router;
