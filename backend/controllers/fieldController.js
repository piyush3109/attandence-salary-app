const Visit = require('../models/Visit');

// @desc    Check-in at client site
// @route   POST /api/field/check-in
const visitCheckIn = async (req, res) => {
    try {
        const { clientName, latitude, longitude, address, purpose } = req.body;
        const visit = await Visit.create({
            employee: req.user._id,
            clientName,
            location: {
                coordinates: [longitude, latitude],
                address
            },
            purpose,
            status: 'Ongoing'
        });
        res.status(201).json(visit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Check-out from client site
// @route   PUT /api/field/check-out/:id
const visitCheckOut = async (req, res) => {
    try {
        const { notes } = req.body;
        const visit = await Visit.findById(req.params.id);
        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        visit.checkOutTime = new Date();
        visit.notes = notes;
        visit.status = 'Completed';
        await visit.save();
        res.json(visit);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get All Visits (Admin) or My Visits (Employee)
// @route   GET /api/field/visits
const getVisits = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'employee') query.employee = req.user._id;
        const visits = await Visit.find(query).populate('employee', 'name employeeId').sort('-createdAt');
        res.json(visits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    visitCheckIn,
    visitCheckOut,
    getVisits
};
