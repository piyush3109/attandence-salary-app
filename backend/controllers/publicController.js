const Employee = require('../models/Employee');

// @desc    Verify Employee (Public)
// @route   GET /api/public/verify/:employeeId
const verifyEmployee = async (req, res) => {
    try {
        const employee = await Employee.findOne({ employeeId: req.params.employeeId })
            .select('name position status joiningDate exitDate -_id');

        if (!employee) return res.status(404).json({ verified: false, message: 'Invalid ID' });

        res.json({ verified: true, data: employee });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { verifyEmployee };
