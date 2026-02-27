const Advance = require('../models/Advance');

const addAdvance = async (req, res) => {
    const { employeeId, amount, reason, date } = req.body;
    try {
        const advance = await Advance.create({
            employee: employeeId,
            amount,
            description: reason || 'Advance Payment',
            date: date || Date.now()
        });
        res.status(201).json(advance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getAllAdvances = async (req, res) => {
    try {
        const advances = await Advance.find({}).populate('employee', 'name').sort('-date');
        res.json(advances);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getEmployeeAdvances = async (req, res) => {
    try {
        // Privacy Check: Employee can only see their own advances
        if (req.user.role === 'employee' && req.user._id.toString() !== req.params.employeeId) {
            return res.status(403).json({ message: 'Access denied. You can only view your own advances.' });
        }

        const advances = await Advance.find({ employee: req.params.employeeId }).sort('-date');
        res.json(advances);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteAdvance = async (req, res) => {
    try {
        await Advance.findByIdAndDelete(req.params.id);
        res.json({ message: 'Advance removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addAdvance, getEmployeeAdvances, getAllAdvances, deleteAdvance };
