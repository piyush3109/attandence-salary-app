const Training = require('../models/Training');
const Employee = require('../models/Employee');

// @desc    Create Training
// @route   POST /api/trainings
const createTraining = async (req, res) => {
    try {
        const training = await Training.create(req.body);
        res.status(201).json(training);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get All Trainings
// @route   GET /api/trainings
const getTrainings = async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'employee') {
            query['attendees.employee'] = req.user._id;
        }
        const trainings = await Training.find(query).populate('attendees.employee', 'name employeeId');
        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Attendee Status / Complete Training
// @route   PUT /api/trainings/:id/attendee/:employeeId
const updateAttendeeStatus = async (req, res) => {
    try {
        const { status, score, certificateUrl } = req.body;
        const training = await Training.findById(req.params.id);
        if (!training) return res.status(404).json({ message: 'Training not found' });

        const attendee = training.attendees.find(a => a.employee.toString() === req.params.employeeId);
        if (!attendee) return res.status(404).json({ message: 'Attendee not found' });

        if (status) attendee.status = status;
        if (score) attendee.score = score;
        if (certificateUrl) attendee.certificateUrl = certificateUrl;

        // If completed, update employee skill
        if (status === 'Completed') {
            const employee = await Employee.findById(req.params.employeeId);
            if (employee && training.skillTaught) {
                const skillIndex = employee.skills.findIndex(s => s.name === training.skillTaught);
                if (skillIndex > -1) {
                    // Update level if necessary or just confirm
                    employee.skills[skillIndex].level = training.level || 'Intermediate';
                } else {
                    employee.skills.push({ name: training.skillTaught, level: training.level || 'Intermediate' });
                }
                await employee.save();
            }
        }

        await training.save();
        res.json(training);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createTraining,
    getTrainings,
    updateAttendeeStatus
};
