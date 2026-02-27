const Attendance = require('../models/Attendance');
const { DateTime } = require('luxon');
const { db } = require('../config/firebase');

// @desc    Mark attendance
// @route   POST /api/attendance
const markAttendance = async (req, res) => {
    const { employeeId, status, date, workingHours, checkInTime, checkOutTime, location, isMockLocation, deviceInfo } = req.body;
    try {
        const orgId = req.user.orgId || 'default';
        const attendanceDate = DateTime.fromISO(date).startOf('day').toJSDate();
        const dateStr = DateTime.fromISO(date).toFormat('yyyy-MM-dd');

        // Anti-fraud: Block mock location apps
        if (isMockLocation) {
            return res.status(403).json({ message: 'Mock location / Fake GPS detected. Attendance rejected.' });
        }

        // Check for duplicate
        let attendanceRecord = await Attendance.findOne({ employee: employeeId, date: attendanceDate, orgId });

        if (attendanceRecord) {
            attendanceRecord.status = status;
            attendanceRecord.workingHours = workingHours || attendanceRecord.workingHours;
            if (checkOutTime) attendanceRecord.checkOutTime = checkOutTime;
            await attendanceRecord.save();
        } else {
            attendanceRecord = await Attendance.create({
                employee: employeeId,
                status,
                date: attendanceDate,
                workingHours: workingHours || 0,
                checkInTime: checkInTime || new Date(),
                location,
                deviceInfo,
                ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                orgId
            });
        }
        // Sync with Firestore for Real-Time UI (only if Firestore is available)
        if (db) {
            try {
                await db.collection('liveAttendance').doc(`${dateStr}_${employeeId}`).set({
                    employeeId,
                    status,
                    date: dateStr,
                    workingHours: workingHours || 0,
                    location: location || null,
                    updatedAt: new Date().toISOString(),
                    orgId
                }, { merge: true });
            } catch (fsError) {
                console.error('Firestore Sync Error:', fsError.message);
                // Don't fail the request if firestore fails
            }
        }

        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance_update', {
                employeeId,
                status,
                message: `Attendance marked as ${status} for ${DateTime.fromISO(date).toFormat('dd MMM yyyy')}`,
                date: date,
            });
        }

        res.json(attendanceRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const { exportAttendanceToCSV } = require('../utils/exportUtils');

// @desc    Get attendance for a date
// @route   GET /api/attendance
const getAttendanceByDate = async (req, res) => {
    const { date, format } = req.query;
    try {
        const orgId = req.user.orgId || 'default';
        const targetDate = DateTime.fromISO(date).startOf('day').toJSDate();
        const records = await Attendance.find({ date: targetDate, orgId }).populate('employee', 'name position');

        if (format === 'csv') {
            const csv = exportAttendanceToCSV(records.map(r => ({
                ...r._doc,
                date: DateTime.fromJSDate(r.date).toFormat('yyyy-MM-dd')
            })));
            res.header('Content-Type', 'text/csv');
            res.attachment(`Attendance_${date}.csv`);
            return res.send(csv);
        }

        res.json(records);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get attendance for specific employee by range
// @route   GET /api/attendance/employee/:employeeId
const getEmployeeAttendanceHistory = async (req, res) => {
    const { employeeId } = req.params;
    const { start, end } = req.query;
    try {
        const orgId = req.user.orgId || 'default';
        // Privacy Check: Employee can only see their own history
        if (req.user.role === 'employee' && req.user._id.toString() !== employeeId) {
            return res.status(403).json({ message: 'Access denied. You can only view your own attendance history.' });
        }

        const records = await Attendance.find({
            employee: employeeId,
            orgId,
            date: {
                $gte: DateTime.fromISO(start).startOf('day').toJSDate(),
                $lte: DateTime.fromISO(end).endOf('day').toJSDate()
            }
        }).sort('date');
        res.json(records);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { markAttendance, getAttendanceByDate, getEmployeeAttendanceHistory };
