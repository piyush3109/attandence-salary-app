const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const { cacheGet } = require('../config/redis');

// ---------------------------------------------------------------------------
// ROLE HIERARCHY — higher index = higher privilege
// ---------------------------------------------------------------------------
const ROLE_HIERARCHY = ['employee', 'accountant', 'hr', 'manager', 'ceo', 'admin'];

const roleRank = (role) => {
    const idx = ROLE_HIERARCHY.indexOf(role);
    return idx === -1 ? -1 : idx;
};

// ---------------------------------------------------------------------------
// protect — authenticate via JWT; attach req.user
// ---------------------------------------------------------------------------
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Check if token has been blacklisted (logout)
            const blacklisted = await cacheGet(`blacklist:${token}`);
            if (blacklisted) {
                return res.status(401).json({ message: 'Token revoked. Please log in again.' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check Admin first
            let user = await Admin.findById(decoded.id).select('-password');
            if (user) {
                req.user = user;
                req.userType = 'admin';
                req.token = token;
                return next();
            }

            // Check Employee
            user = await Employee.findById(decoded.id).select('-password');
            if (user && user.active) {
                req.user = user;
                req.userType = 'employee';
                req.token = token;
                return next();
            }

            return res.status(401).json({ message: 'Not authorized, user not found or inactive' });
        } catch (error) {
            console.error('Authorization failed:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// ---------------------------------------------------------------------------
// checkRole — exact role match guard
// Usage: checkRole(['admin', 'ceo'])
// ---------------------------------------------------------------------------
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
            });
        }
        next();
    };
};

// ---------------------------------------------------------------------------
// requireMinRole — allow the given role AND all roles above it in hierarchy
// Usage: requireMinRole('manager')  →  allows manager, ceo, admin
// ---------------------------------------------------------------------------
const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const userRank = roleRank(req.user.role);
        const minRank = roleRank(minRole);
        if (userRank < minRank) {
            return res.status(403).json({
                message: `Access denied. Requires '${minRole}' role or above. Your role: ${req.user.role}`
            });
        }
        next();
    };
};

// ---------------------------------------------------------------------------
// adminOnly — shorthand for admin-only routes
// ---------------------------------------------------------------------------
const adminOnly = checkRole(['admin']);

// ---------------------------------------------------------------------------
// selfOrRole — allow a user to access their own resource OR have the required role
// E.g. employee can see their own record; admin/manager can see all
// Usage: selfOrRole('id', ['admin', 'manager'])
//   where 'id' is the req.params key to compare against req.user._id
// ---------------------------------------------------------------------------
const selfOrRole = (paramKey, roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const isSelf = req.params[paramKey] && req.params[paramKey].toString() === req.user._id.toString();
        const hasRole = roles.includes(req.user.role);
        if (!isSelf && !hasRole) {
            return res.status(403).json({
                message: `Access denied. You can only access your own data or need one of: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { protect, checkRole, requireMinRole, adminOnly, selfOrRole, ROLE_HIERARCHY, roleRank };
