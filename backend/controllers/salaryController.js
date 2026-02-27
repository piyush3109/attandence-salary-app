const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Advance = require('../models/Advance');
const { DateTime } = require('luxon');
const { exportToCSV, generateSalaryPDF } = require('../utils/exportUtils');

// @desc    Calculate and get salary report
const getSalaryReport = async (req, res) => {
    const { month, year, format } = req.query; // e.g. month=2, year=2024
    try {
        const orgId = req.user.orgId || 'default';
        const start = DateTime.fromObject({ year, month, day: 1 }).startOf('day');
        const end = start.endOf('month');

        const employees = await Employee.find({ active: true, orgId });

        const report = await Promise.all(employees.map(async (emp) => {
            const attendance = await Attendance.find({
                employee: emp._id,
                orgId,
                date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
            });

            const advances = await Advance.find({
                employee: emp._id,
                orgId,
                date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
            });
            // ... (rest of report mapping)
            let presentDays = 0;
            let paidLeaveDays = 0;
            let totalHours = 0;
            let overtimeHours = 0;
            let overtimePay = 0;

            attendance.forEach(record => {
                if (record.status === 'Present') {
                    presentDays++;
                    const hours = record.workingHours || 0;
                    totalHours += hours;
                    if (hours > 8) {
                        const extra = hours - 8;
                        overtimeHours += extra;
                    }
                } else if (record.status === 'Paid Leave' || record.status === 'Sick Leave') {
                    paidLeaveDays++;
                }
            });

            const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);

            let baseSalary = 0;
            const hourlyRate = emp.rateType === 'per_day' ? (emp.salaryRate / 8) : emp.salaryRate;

            if (emp.rateType === 'per_day') {
                baseSalary = (presentDays + paidLeaveDays) * emp.salaryRate;
            } else {
                // For per_hour, we pay actual hours worked up to 8 per day + leaves at 8h rate
                baseSalary = (totalHours - overtimeHours) * emp.salaryRate + (paidLeaveDays * 8 * emp.salaryRate);
            }

            // Calculate Overtime (1.5x rate)
            overtimePay = overtimeHours * hourlyRate * 1.5;

            const totalEarnings = baseSalary + overtimePay;

            return {
                _id: emp._id,
                name: emp.name,
                position: emp.position,
                rate: emp.salaryRate,
                rateType: emp.rateType,
                presentDays,
                paidLeaveDays,
                totalHours,
                overtimeHours,
                overtimePay,
                baseSalary,
                totalAdvance,
                totalEarnings,
                finalPayable: totalEarnings - totalAdvance
            };
        }));

        if (format === 'csv') {
            const fields = ['name', 'position', 'rate', 'rateType', 'presentDays', 'totalHours', 'baseSalary', 'totalAdvance', 'finalPayable'];
            const csv = exportToCSV(report, fields);
            res.header('Content-Type', 'text/csv');
            res.attachment(`Salary_Report_${month}_${year}.csv`);
            return res.send(csv);
        }

        if (format === 'pdf') {
            res.header('Content-Type', 'application/pdf');
            res.attachment(`Salary_Report_${month}_${year}.pdf`);
            return generateSalaryPDF(report, month, year, res);
        }

        // Emit salary notification
        const io = req.app.get('io');
        if (io) {
            io.emit('salary_update', {
                message: `Salary report for ${start.toFormat('MMMM yyyy')} has been generated`,
                month,
                year,
            });
        }

        res.json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Generate individual salary slip
const getSalarySlip = async (req, res) => {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    try {
        const orgId = req.user.orgId || 'default';
        // Privacy Check: Employee can only see their own slip
        if (req.user.role === 'employee' && req.user._id.toString() !== employeeId) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (isNaN(monthNum) || isNaN(yearNum)) {
            return res.status(400).json({ message: 'Invalid month or year' });
        }

        const start = DateTime.fromObject({ year: yearNum, month: monthNum, day: 1 }).startOf('day');
        const end = start.endOf('month');

        const emp = await Employee.findOne({ _id: employeeId, orgId });
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const attendance = await Attendance.find({
            employee: emp._id,
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        });

        const advances = await Advance.find({
            employee: emp._id,
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        });
        // ... (rest of slip logic)
        let presentDays = 0;
        let paidLeaveDays = 0;
        let totalHours = 0;
        let overtimeHours = 0;

        attendance.forEach(record => {
            if (record.status === 'Present') {
                presentDays++;
                const hours = record.workingHours || 0;
                totalHours += hours;
                if (hours > 8) overtimeHours += (hours - 8);
            } else if (record.status === 'Paid Leave' || record.status === 'Sick Leave') {
                paidLeaveDays++;
            }
        });

        const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);
        const hourlyRate = emp.rateType === 'per_day' ? (emp.salaryRate / 8) : emp.salaryRate;

        let baseSalary = 0;
        if (emp.rateType === 'per_day') {
            baseSalary = (presentDays + paidLeaveDays) * emp.salaryRate;
        } else {
            baseSalary = (totalHours - overtimeHours) * emp.salaryRate + (paidLeaveDays * 8 * emp.salaryRate);
        }

        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const totalEarnings = baseSalary + overtimePay;

        const slipData = [{
            name: emp.name,
            position: emp.position,
            rate: emp.salaryRate,
            rateType: emp.rateType,
            presentDays,
            paidLeaveDays,
            totalHours,
            overtimeHours,
            overtimePay,
            baseSalary,
            totalAdvance,
            totalEarnings,
            finalPayable: totalEarnings - totalAdvance
        }];

        res.header('Content-Type', 'application/pdf');
        res.attachment(`SalarySlip_${emp.name}_${month}_${year}.pdf`);
        generateSalaryPDF(slipData, month, year, res);

    } catch (error) {
        console.error('getSalarySlip error:', error.stack || error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get self salary history
const getMySalaryHistory = async (req, res) => {
    const { month, year } = req.query;
    try {
        const orgId = req.user.orgId || 'default';
        const start = DateTime.fromObject({ year, month, day: 1 }).startOf('day');
        const end = start.endOf('month');

        const emp = await Employee.findOne({ _id: req.user._id, orgId });
        if (!emp) return res.status(404).json({ message: 'Employee not found' });

        const attendance = await Attendance.find({
            employee: emp._id,
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        });

        const advances = await Advance.find({
            employee: emp._id,
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        });

        let presentDays = 0;
        let paidLeaveDays = 0;
        let totalHours = 0;
        let overtimeHours = 0;

        attendance.forEach(record => {
            if (record.status === 'Present') {
                presentDays++;
                const hours = record.workingHours || 0;
                totalHours += hours;
                if (hours > 8) overtimeHours += (hours - 8);
            } else if (record.status === 'Paid Leave' || record.status === 'Sick Leave') {
                paidLeaveDays++;
            }
        });

        const totalAdvance = advances.reduce((acc, curr) => acc + curr.amount, 0);
        const hourlyRate = emp.rateType === 'per_day' ? (emp.salaryRate / 8) : emp.salaryRate;

        let baseSalary = 0;
        if (emp.rateType === 'per_day') {
            baseSalary = (presentDays + paidLeaveDays) * emp.salaryRate;
        } else {
            baseSalary = (totalHours - overtimeHours) * emp.salaryRate + (paidLeaveDays * 8 * emp.salaryRate);
        }

        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const totalEarnings = baseSalary + overtimePay;

        res.json({
            month,
            year,
            presentDays,
            paidLeaveDays,
            totalHours,
            overtimeHours,
            overtimePay,
            baseSalary,
            totalAdvance,
            totalEarnings,
            finalPayable: totalEarnings - totalAdvance
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getSalaryReport, getSalarySlip, getMySalaryHistory };
