const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const { syncEmployeeToFirebase } = require('../utils/firebaseSync');
const { sendNotificationEmail } = require('../utils/emailService');

// @desc    Get all employees
// @route   GET /api/employees
const getEmployees = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { search } = req.query;
        let query = { active: true, orgId };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        const employees = await Employee.find(query).select('-password');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create employee
// @route   POST /api/employees
const createEmployee = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const employee = await Employee.create({ ...req.body, orgId });
        await syncEmployeeToFirebase(employee);
        res.status(201).json(employee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
        }

        const employee = await Employee.findOne({ _id: req.params.id, orgId }).select('-password');
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
const updateEmployee = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const updateData = { ...req.body };
        if (!updateData.password) {
            delete updateData.password;
        }

        // Check if employee exists in this org
        const existingEmployee = await Employee.findOne({ _id: req.params.id, orgId });
        if (!existingEmployee) return res.status(404).json({ message: 'Employee not found' });

        // If the requester is an employee editing their own profile,
        // restrict them from changing position, salary, role
        const isOwnProfile = req.user._id.toString() === req.params.id;
        const isPrivileged = ['admin', 'ceo', 'manager', 'accountant'].includes(req.user.role);

        if (isOwnProfile && !isPrivileged) {
            // Employee can only update personal info
            const allowedFields = ['name', 'email', 'phone', 'address', 'guarantor', 'profilePhoto'];
            const restrictedUpdate = {};
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    restrictedUpdate[field] = updateData[field];
                }
            }
            const employee = await Employee.findByIdAndUpdate(req.params.id, restrictedUpdate, { new: true }).select('-password');
            await syncEmployeeToFirebase(employee);
            return res.json(employee);
        }

        // Admin/CEO/Manager can update everything including position, salary, role
        const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');

        await syncEmployeeToFirebase(employee);

        // Send notification email if salary or position was changed
        if (updateData.salaryRate || updateData.position) {
            const changes = [];
            if (updateData.position) changes.push(`Position updated to: ${updateData.position}`);
            if (updateData.salaryRate) changes.push(`Salary rate updated to: ₹${updateData.salaryRate}`);

            if (employee.email) {
                sendNotificationEmail(
                    employee.email,
                    employee.name,
                    'Profile Updated by Admin',
                    changes.join('<br/>')
                ).catch(err => console.warn('Notification email failed:', err.message));
            }
        }

        res.json(employee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Promote user to admin role
// @route   PUT /api/employees/:id/promote
const promoteToAdmin = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const { newRole } = req.body; // admin, ceo, manager, accountant
        const validRoles = ['admin', 'ceo', 'manager', 'accountant'];

        if (!validRoles.includes(newRole)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        // Only admin/ceo can promote
        if (!['admin', 'ceo'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only Admin or CEO can promote users' });
        }

        const employee = await Employee.findOne({ _id: req.params.id, orgId });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Create an Admin account for the promoted user
        const existingAdmin = await Admin.findOne({ email: employee.email });
        if (existingAdmin) {
            // Update existing admin role
            existingAdmin.role = newRole;
            existingAdmin.orgId = orgId;
            await existingAdmin.save();
        } else {
            // Create new admin entry  
            await Admin.create({
                username: employee.name,
                email: employee.email || `${employee.employeeId}@worksync.local`,
                password: employee.password, // Already hashed
                role: newRole,
                profilePhoto: employee.profilePhoto,
                orgId
            });
        }

        // Update employee role too
        employee.role = newRole;
        await employee.save();

        // Send notification
        if (employee.email) {
            sendNotificationEmail(
                employee.email,
                employee.name,
                `You've been promoted to ${newRole.toUpperCase()}!`,
                `Congratulations! You have been promoted to <strong>${newRole.toUpperCase()}</strong> role. You now have additional permissions in the system.`
            ).catch(err => console.warn('Promotion email failed:', err.message));
        }

        res.json({ message: `${employee.name} has been promoted to ${newRole}`, employee });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const employee = await Employee.findOneAndUpdate({ _id: req.params.id, orgId }, { active: false }, { new: true });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        await syncEmployeeToFirebase(employee);

        res.json({ message: 'Employee removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Upload KYC Document
// @route   POST /api/employees/:id/documents
const uploadDocument = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';
        const employeeId = req.params.id;
        const { title, type } = req.body;

        if (req.user.role === 'employee' && req.user._id.toString() !== employeeId) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const employee = await Employee.findOne({ _id: employeeId, orgId });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const newDoc = {
            title: title || req.file.originalname,
            url: `/uploads/documents/${req.file.filename}`,
            category: type || 'Other',
            uploadedAt: new Date()
        };

        employee.documents.push(newDoc);
        await employee.save();

        res.status(201).json({ message: 'Document uploaded successfully', document: newDoc });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    promoteToAdmin,
    uploadDocument
};
