const Leave = require('../models/Leave');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Apply for leave (Employee)
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { type, startDate, endDate, reason } = req.body;

        const leave = await Leave.create({
            employee: req.user._id,
            orgId,
            type,
            startDate,
            endDate,
            reason
        });

        // Emit real-time notification for leave application
        const io = req.app.get('io');
        if (io) {
            io.emit('notification', {
                type: 'leave',
                title: '🏖️ New Leave Request',
                message: `${req.user.name || 'An employee'} applied for ${type} leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
                priority: 'medium',
            });
        }

        res.status(201).json(leave);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get logged in user's leaves
// @route   GET /api/leaves/my
// @access  Private
const getMyLeaves = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const leaves = await Leave.find({ employee: req.user._id, orgId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const leaves = await Leave.find({ orgId }).populate('employee', 'name email').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { status, comments } = req.body;

        const leave = await Leave.findOne({ _id: req.params.id, orgId }).populate('employee');
        if (!leave) return res.status(404).json({ message: 'Leave not found' });

        leave.status = status;
        leave.comments = comments || leave.comments;
        leave.approvedBy = req.user._id;

        await leave.save();
        // ... rest of email logic
        // Send email notification to employee
        if (leave.employee && leave.employee.email) {
            const subject = `Leave Request ${status}`;
            const message = `Your leave request for ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status.toLowerCase()}.\n\nComments: ${comments || 'None'}`;
            try {
                await sendNotificationEmail(leave.employee.email, leave.employee.name, subject, message);
            } catch (err) {
                console.error("Failed to send leave notification email:", err);
            }
        }

        // Emit real-time notification for leave status update
        const io = req.app.get('io');
        if (io) {
            io.emit('leave_update', {
                employeeId: leave.employee._id,
                status,
                message: `Your ${leave.type} leave request has been ${status.toLowerCase()}`,
                priority: status === 'Approved' ? 'low' : 'high',
            });
        }

        res.json(leave);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus };
