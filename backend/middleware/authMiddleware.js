const jwt = require('jsonwebtoken');
const { admin, auth: firebaseAuth } = require('../config/firebase');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify Local JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check Admin first
            let user = await Admin.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
                return next();
            }

            // Check Employee
            user = await Employee.findById(decoded.id).select('-password');
            if (user && user.active) {
                req.user = user;
                return next();
            }

            return res.status(401).json({ message: 'Not authorized, user not found' });
        } catch (error) {
            console.error('Authorization failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
        }
        next();
    };
};

module.exports = { protect, checkRole };
