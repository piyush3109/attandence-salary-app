const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { DateTime } = require('luxon');

const getDashboardStats = async (req, res) => {
    try {
        const orgId = req.user.orgId || 'default';

        if (req.user.role === 'employee') {
            // Employee specific stats
            const start = DateTime.now().startOf('month');
            const end = DateTime.now().endOf('month');

            const monthAttendance = await Attendance.find({
                employee: req.user._id,
                orgId,
                date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
            });

            const presentDays = monthAttendance.filter(a => a.status === 'Present').length;
            const leaves = monthAttendance.filter(a => ['Paid Leave', 'Sick Leave'].includes(a.status)).length;
            const totalHours = monthAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);

            return res.json({
                role: 'employee',
                presentDays,
                leaves,
                totalHours,
                workingDays: presentDays + leaves
            });
        }

        // Admin/Manager Stats
        const totalEmployees = await Employee.countDocuments({ orgId, active: true });
        const today = DateTime.now().startOf('day').toJSDate();
        const todayAttendance = await Attendance.find({ orgId, date: { $gte: today } }).populate('employee');

        const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
        const absentToday = todayAttendance.filter(a => a.status === 'Absent').length;

        const start = DateTime.now().startOf('month');
        const end = DateTime.now().endOf('month');

        const monthAttendance = await Attendance.find({
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        }).populate('employee');

        let estimatedSalary = 0;
        monthAttendance.forEach(a => {
            if ((a.status === 'Present' || a.status === 'Paid Leave' || a.status === 'Sick Leave') && a.employee) {
                if (a.employee.rateType === 'per_day') {
                    estimatedSalary += a.employee.salaryRate;
                } else {
                    const hours = a.status === 'Present' ? (a.workingHours || 0) : 8;
                    estimatedSalary += (hours * a.employee.salaryRate);
                }
            }
        });

        // Fetch Recent Activity
        const Task = require('../models/Task');
        const Message = require('../models/Message');
        const recentTasks = await Task.find({ orgId }).sort({ createdAt: -1 }).limit(1).populate('assignedTo');
        const recentMessages = await Message.find({ orgId }).sort({ createdAt: -1 }).limit(1).populate('sender');

        const recentActivity = [];
        if (todayAttendance.length > 0) {
            recentActivity.push({ type: 'Attendance', title: 'Attendance logged', subtitle: `Today by ${todayAttendance[todayAttendance.length - 1]?.employee?.name || 'an employee'}`, icon: 'CalendarCheck' });
        }
        if (recentMessages.length > 0) {
            recentActivity.push({ type: 'Message', title: 'New message available', subtitle: `From ${recentMessages[0]?.sender?.name || 'Someone'}`, icon: 'MessageSquare' });
        }
        if (recentTasks.length > 0) {
            recentActivity.push({ type: 'Task', title: 'Task updated', subtitle: `${recentTasks[0].title}`, icon: 'ClipboardList' });
        }

        res.json({
            role: 'admin',
            totalEmployees,
            presentToday,
            absentToday,
            estimatedSalary,
            recentActivity
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        if (req.user.role === 'employee') return res.status(403).json({ message: 'Access denied' });

        const orgId = req.user.orgId || 'default';
        const start = DateTime.now().startOf('month');
        const end = DateTime.now().endOf('month');

        const employees = await Employee.find({ orgId, active: true });
        const monthAttendance = await Attendance.find({
            orgId,
            date: { $gte: start.toJSDate(), $lte: end.toJSDate() }
        }).populate('employee');

        // Salary by Department/Position
        const salaryExpenseByPosition = {};
        monthAttendance.forEach(a => {
            if ((a.status === 'Present' || a.status === 'Paid Leave') && a.employee) {
                const pos = a.employee.position || 'General';
                if (!salaryExpenseByPosition[pos]) salaryExpenseByPosition[pos] = 0;
                let dailyPay = 0;
                if (a.employee.rateType === 'per_day') {
                    dailyPay = a.employee.salaryRate;
                } else {
                    const hours = a.status === 'Present' ? (a.workingHours || 0) : 8;
                    dailyPay = hours * a.employee.salaryRate;
                }
                salaryExpenseByPosition[pos] += dailyPay;
            }
        });

        const salaryExpenseData = Object.keys(salaryExpenseByPosition).map(key => ({
            name: key,
            expense: salaryExpenseByPosition[key]
        })).sort((a, b) => b.expense - a.expense).slice(0, 5); // top 5

        // Attendance Trend (Last 7 Days)
        const trendData = [];
        for (let i = 6; i >= 0; i--) {
            const d = DateTime.now().minus({ days: i }).startOf('day');
            const dailyA = monthAttendance.filter(a => DateTime.fromJSDate(a.date).hasSame(d, 'day'));
            trendData.push({
                date: d.toFormat('dd MMM'),
                present: dailyA.filter(a => a.status === 'Present').length,
                absent: dailyA.filter(a => a.status === 'Absent').length,
            });
        }

        // Department Productivity (Present vs Total Employees by Position)
        const today = DateTime.now().startOf('day');
        const todayA = monthAttendance.filter(a => DateTime.fromJSDate(a.date).hasSame(today, 'day'));

        const positionStats = {};
        employees.forEach(emp => {
            const pos = emp.position || 'General';
            if (!positionStats[pos]) positionStats[pos] = { total: 0, present: 0 };
            positionStats[pos].total += 1;
        });

        todayA.forEach(a => {
            if (a.employee && a.status === 'Present') {
                const pos = a.employee.position || 'General';
                if (positionStats[pos]) positionStats[pos].present += 1;
            }
        });

        const productivityData = Object.keys(positionStats).map(key => ({
            name: key,
            rate: Math.round((positionStats[key].present / positionStats[key].total) * 100) || 0
        })).sort((a, b) => b.rate - a.rate).slice(0, 5);

        res.json({
            salaryExpenseData,
            trendData,
            productivityData
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const seedDemoData = async (req, res) => {
    try {
        // Clear existing data
        await Employee.deleteMany({ role: 'employee' });
        await Attendance.deleteMany({});

        const demoEmployees = [
            { name: 'John Doe', email: 'john@example.com', phone: '9876543210', position: 'Developer', salaryRate: 1500, rateType: 'per_day', password: 'password123', role: 'employee', active: true },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '9876543211', position: 'Designer', salaryRate: 200, rateType: 'per_hour', password: 'password123', role: 'employee', active: true },
            { name: 'Bob Wilson', email: 'bob@example.com', phone: '9876543212', position: 'Developer', salaryRate: 800, rateType: 'per_day', password: 'password123', role: 'employee', active: true },
            { name: 'Alice Brown', email: 'alice@example.com', phone: '9876543213', position: 'Accountant', salaryRate: 1200, rateType: 'per_day', password: 'password123', role: 'employee', active: true }
        ];

        const createdEmployees = await Employee.insertMany(demoEmployees);

        const startDate = DateTime.now().startOf('month');
        const todayCount = DateTime.now().day;
        const attendanceRecords = [];

        for (let day = 0; day < todayCount; day++) {
            const currentDate = startDate.plus({ days: day });
            if (currentDate.weekday > 6) continue; // Skip Sundays

            createdEmployees.forEach(emp => {
                const status = Math.random() > 0.1 ? 'Present' : 'Absent';
                attendanceRecords.push({
                    employee: emp._id,
                    status,
                    date: currentDate.toJSDate(),
                    workingHours: status === 'Present' ? (emp.rateType === 'per_hour' ? 8 : 8) : 0
                });
            });
        }

        await Attendance.insertMany(attendanceRecords);

        res.status(201).json({ message: 'Demo data seeded successfully!', employeesCount: createdEmployees.length, recordsCount: attendanceRecords.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats, getAnalytics, seedDemoData };
