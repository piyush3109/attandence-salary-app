const Employee = require('../models/Employee');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

// @desc    Initiate Exit Process
// @route   POST /api/lifecycle/:id/exit
const initiateExit = async (req, res) => {
    try {
        const { exitDate, exitReason } = req.body;
        const employee = await Employee.findById(req.params.id);

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        employee.status = 'Exited';
        employee.exitDate = exitDate || new Date();
        employee.exitReason = exitReason;
        employee.active = false;

        // Default Checklist
        employee.offboardingChecklist = [
            { item: 'Return laptop and equipment', completed: false },
            { item: 'Revoke access to email/systems', completed: false },
            { item: 'Final settlement calculation', completed: false },
            { item: 'Exit interview conducted', completed: false }
        ];

        await employee.save();
        res.json(employee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Exit Checklist
// @route   PUT /api/lifecycle/:id/checklist
const updateChecklist = async (req, res) => {
    try {
        const { checklist } = req.body;
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        employee.offboardingChecklist = checklist;
        await employee.save();
        res.json(employee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Generate Experience Letter
// @route   GET /api/lifecycle/:id/experience-letter
const generateExperienceLetter = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const doc = new PDFDocument({ margin: 50 });
        const filename = `Experience_Letter_${employee.employeeId}.pdf`;
        const filePath = path.join(__dirname, '../uploads/documents', filename);

        // Ensure directory exists
        const dir = path.join(__dirname, '../uploads/documents');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Letterhead
        doc.fontSize(20).text('HYBRID LINK CORP', { align: 'center' });
        doc.fontSize(10).text('123 Corporate Plaza, Digital Valley, India', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(16).text('TO WHOM IT MAY CONCERN', { align: 'center', underline: true });
        doc.moveDown(2);

        doc.fontSize(12).text(`Date: ${DateTime.now().toFormat('dd LLL yyyy')}`);
        doc.moveDown(2);

        const joinDate = employee.joiningDate ? DateTime.fromJSDate(employee.joiningDate).toFormat('dd LLL yyyy') : 'N/A';
        const exitDate = employee.exitDate ? DateTime.fromJSDate(employee.exitDate).toFormat('dd LLL yyyy') : 'Present';

        doc.text(`This is to certify that Mr./Ms. ${employee.name} (ID: ${employee.employeeId}) was employed with Hybrid Link Corp from ${joinDate} to ${exitDate}.`, { align: 'justify' });
        doc.moveDown();
        doc.text(`During this tenure, ${employee.name} served as a ${employee.position} and exhibited remarkable dedication, professional competence, and high ethical standards.`, { align: 'justify' });
        doc.moveDown();
        doc.text(`We wish ${employee.name} the very best in all future endeavors.`);
        doc.moveDown(4);

        doc.text('For Hybrid Link Corp,');
        doc.moveDown(2);
        doc.text('Authorized Signatory');

        doc.end();

        stream.on('finish', () => {
            res.download(filePath);
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Probation Alerts (Approaching completion)
// @route   GET /api/lifecycle/probation-alerts
const getProbationAlerts = async (req, res) => {
    try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const employees = await Employee.find({
            status: 'Probation',
            probationEnd: { $lte: nextWeek }
        });

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initiateExit,
    updateChecklist,
    generateExperienceLetter,
    getProbationAlerts
};
