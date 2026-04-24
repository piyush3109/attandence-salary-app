const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const { admin: firebaseAdmin, auth: firebaseAuth } = require('../config/firebase');
const { syncEmployeeToFirebase } = require('../utils/firebaseSync');
const {
    sendVerificationOTP,
    verifyStoredOTP,
    sendGreetingEmail,
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    sendPasswordChangedEmail,
    sendNotificationEmail,
    sendRoleChangeEmail
} = require('../utils/emailService');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------
const TOKEN_TTL = '30d';
const TOKEN_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

const findUser = async (identifier) => {
    let user = await Admin.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    let isEmployee = false;
    if (!user) {
        user = await Employee.findOne({
            $or: [{ email: identifier }, { phone: identifier }, { employeeId: identifier }],
            active: true
        });
        isEmployee = !!user;
    }
    return { user, isEmployee };
};

// --------------------------------------------------------------------------
// POST /api/auth/login
// --------------------------------------------------------------------------
const loginUser = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const { user, isEmployee } = await findUser(identifier);
        if (user && (await user.matchPassword(password))) {
            return res.json({
                _id: user._id,
                username: isEmployee ? user.name : user.username,
                email: user.email,
                role: user.role,
                profilePhoto: user.profilePhoto || '',
                theme: user.theme || 'light',
                token: generateToken(user._id),
                orgId: user.orgId || 'default',
                isEmployee
            });
        }
        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/auth/logout  (requires protect middleware)
// Blacklists the current JWT in Redis so it cannot be reused
// --------------------------------------------------------------------------
const logoutUser = async (req, res) => {
    try {
        const token = req.token;
        if (token) {
            // Store blacklisted token until its natural expiry
            await cacheSet(`blacklist:${token}`, '1', TOKEN_SECONDS);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/auth/forgot-password
// Sends a reset OTP to the user's registered email
// --------------------------------------------------------------------------
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        let user = await Admin.findOne({ email });
        let name = user ? user.username : null;
        if (!user) {
            user = await Employee.findOne({ email, active: true });
            name = user ? user.name : null;
        }

        // Always respond with success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'If an account with this email exists, you will receive a reset code.' });
        }

        const result = await sendPasswordResetOTP(email, name);
        if (!result.success) {
            return res.status(500).json({ message: 'Failed to send reset email. Check email configuration.' });
        }

        res.json({ message: 'Password reset code sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/auth/verify-reset-otp
// Verifies the reset OTP and marks the session as verified in Redis
// --------------------------------------------------------------------------
const verifyResetOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const result = await verifyPasswordResetOTP(email, otp);
    if (result.valid) {
        return res.json({ verified: true, message: result.message });
    }
    res.status(400).json({ verified: false, message: result.message });
};

// --------------------------------------------------------------------------
// POST /api/auth/reset-password
// Resets password after OTP has been verified
// --------------------------------------------------------------------------
const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        // Confirm OTP was verified
        const verified = await cacheGet(`reset_verified:${email}`);
        if (!verified) {
            return res.status(403).json({ message: 'OTP not verified. Please complete the OTP step first.' });
        }

        let user = await Admin.findOne({ email });
        let name = user ? user.username : null;
        if (!user) {
            user = await Employee.findOne({ email, active: true });
            name = user ? user.name : null;
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();

        await cacheDel(`reset_verified:${email}`);

        // Send confirmation email (non-blocking)
        sendPasswordChangedEmail(email, name).catch(() => {});

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// PUT /api/auth/change-password  (requires protect middleware)
// For logged-in users who want to change their own password
// --------------------------------------------------------------------------
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password must differ from the current password' });
    }

    try {
        const Model = req.userType === 'admin' ? Admin : Employee;
        const user = await Model.findById(req.user._id);

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

        user.password = newPassword;
        await user.save();

        // Blacklist current token so user must re-login
        if (req.token) {
            await cacheSet(`blacklist:${req.token}`, '1', TOKEN_SECONDS);
        }

        // Send confirmation email (non-blocking)
        const name = req.userType === 'admin' ? user.username : user.name;
        sendPasswordChangedEmail(user.email, name).catch(() => {});

        res.json({ message: 'Password changed successfully. Please log in again with your new password.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// Firebase user verification
// --------------------------------------------------------------------------
const verifyFirebaseUser = async (req, res) => {
    const { email, uid } = req.body;
    try {
        if (firebaseAuth && uid) {
            try {
                const firebaseUser = await firebaseAuth.getUser(uid);
                if (firebaseUser.email !== email) {
                    return res.status(401).json({ authorized: false, message: 'Email mismatch with Firebase account' });
                }
            } catch (fbError) {
                console.warn('Firebase UID verification skipped:', fbError.message);
            }
        }

        let user = await Admin.findOne({ email });
        let role = user ? user.role : null;
        if (!user) {
            user = await Employee.findOne({ email, active: true });
            role = user ? user.role : null;
        }

        if (user) {
            return res.json({
                authorized: true,
                _id: user._id,
                username: role === 'employee' ? user.name : user.username,
                email,
                role,
                profilePhoto: user.profilePhoto || '',
                theme: user.theme || 'light',
                orgId: user.orgId || 'default'
            });
        }
        res.status(403).json({ authorized: false, message: 'User not authorized by admin' });
    } catch (error) {
        console.error('Verify Firebase Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --------------------------------------------------------------------------
// POST /api/auth/setup — create first admin
// --------------------------------------------------------------------------
const createInitialAdmin = async (req, res) => {
    const { username, email, password } = req.body;
    const adminEmail = email || 'tiwariansh626@gmail.com';
    const adminPassword = password || '@piyush3109';
    try {
        const adminExists = await Admin.findOne({ $or: [{ username }, { email: adminEmail }] });
        if (adminExists) return res.status(400).json({ message: 'Admin already exists' });

        await Admin.create({ username: username || 'tiwariansh', email: adminEmail, password: adminPassword, role: 'admin' });
        res.status(201).json({ message: 'Admin created successfully', email: adminEmail });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// PUT /api/auth/theme
// --------------------------------------------------------------------------
const updateUserTheme = async (req, res) => {
    const { theme } = req.body;
    try {
        if (req.user.role === 'employee') {
            await Employee.findByIdAndUpdate(req.user._id, { theme });
        } else {
            await Admin.findByIdAndUpdate(req.user._id, { theme });
        }
        res.json({ message: 'Theme updated' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// POST /api/auth/guest-login
// --------------------------------------------------------------------------
const guestLogin = async (req, res) => {
    const { email, password } = req.body;
    const targetEmail = 'tiwariansh626@gmail.com';
    const targetPassword = '@piyush3109';

    if (email === targetEmail && password === targetPassword) {
        let adminUser = await Admin.findOne({ email: targetEmail });
        if (!adminUser) {
            adminUser = await Admin.create({ username: 'tiwariansh', email: targetEmail, password: targetPassword, role: 'admin' });
        }
        return res.json({
            authorized: true,
            _id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            profilePhoto: adminUser.profilePhoto || '',
            theme: adminUser.theme || 'light',
            token: generateToken(adminUser._id),
            orgId: adminUser.orgId || 'default',
            isGuest: true
        });
    }
    res.status(401).json({ message: 'Invalid credentials' });
};

// --------------------------------------------------------------------------
// OTP for new user email verification
// --------------------------------------------------------------------------
const sendEmailOTP = async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const existingEmployee = await Employee.findOne({ email });
        const existingAdmin = await Admin.findOne({ email });
        if (existingEmployee || existingAdmin) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const result = await sendVerificationOTP(email, name || 'User');
        if (result.success) {
            return res.json({ message: result.message });
        }
        console.warn('Email OTP failed, allowing registration without OTP:', result.message);
        res.json({ message: 'Email service unavailable. Proceeding without verification.', skipOtp: true });
    } catch (error) {
        console.warn('OTP send error:', error.message);
        res.json({ message: 'Email service unavailable. Proceeding without verification.', skipOtp: true });
    }
};

const verifyEmailOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const result = await verifyStoredOTP(email, otp);
    if (result.valid) {
        return res.json({ verified: true, message: result.message });
    }
    res.status(400).json({ verified: false, message: result.message });
};

// --------------------------------------------------------------------------
// POST /api/auth/register
// --------------------------------------------------------------------------
const registerUser = async (req, res) => {
    const { name, email, phone, password, position, address } = req.body;
    try {
        const userExists = await Employee.findOne({ $or: [{ email }, { phone }] });
        if (userExists) return res.status(400).json({ message: 'User with this email or phone already exists' });

        const employeeId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
        const employee = await Employee.create({
            name, email, phone, password,
            position: position || 'Employee',
            address: address || '',
            employeeId,
            salaryRate: 0,
            rateType: 'per_day',
            profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        });

        if (employee) {
            await syncEmployeeToFirebase(employee);
            sendGreetingEmail(email, name, employeeId).catch(err => {
                console.warn('Greeting email failed (non-blocking):', err.message);
            });

            const io = req.app.get('io');
            if (io) {
                io.emit('employee_joined', { name: employee.name, employeeId: employee.employeeId, position: employee.position });
            }

            return res.status(201).json({
                _id: employee._id,
                username: employee.name,
                email: employee.email,
                role: 'employee',
                employeeId: employee.employeeId,
                profilePhoto: employee.profilePhoto,
                token: generateToken(employee._id),
                orgId: employee.orgId || 'default',
                isEmployee: true
            });
        }
        res.status(400).json({ message: 'Invalid user data' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// GET /api/auth/admins
// --------------------------------------------------------------------------
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find({}).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// PUT /api/auth/update-role/:userId  (admin only)
// --------------------------------------------------------------------------
const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { role, userType } = req.body; // userType: 'admin' | 'employee'

    const validAdminRoles = ['admin', 'ceo', 'manager', 'accountant'];
    const validEmployeeRoles = ['employee', 'manager', 'ceo'];
    const validRoles = [...new Set([...validAdminRoles, ...validEmployeeRoles])];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Valid roles: ${validRoles.join(', ')}` });
    }

    try {
        let user;
        if (userType === 'admin') {
            user = await Admin.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        } else {
            user = await Employee.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        const name = userType === 'admin' ? user.username : user.name;
        const changedBy = req.userType === 'admin' ? req.user.username : req.user.name;

        // Send role change email (non-blocking)
        if (user.email) {
            sendRoleChangeEmail(user.email, name, role, changedBy).catch(() => {});
        }

        res.json({ message: `Role updated to '${role}' for ${name}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --------------------------------------------------------------------------
// GET /api/auth/me
// --------------------------------------------------------------------------
const getMe = async (req, res) => {
    res.json({
        _id: req.user._id,
        username: req.userType === 'admin' ? req.user.username : req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePhoto: req.user.profilePhoto || '',
        theme: req.user.theme || 'light',
        orgId: req.user.orgId || 'default',
        userType: req.userType
    });
};

module.exports = {
    loginUser,
    logoutUser,
    verifyFirebaseUser,
    createInitialAdmin,
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
};
