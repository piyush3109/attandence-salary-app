const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const Attendance = require('../models/Attendance');
const Training = require('../models/Training');
const Visit = require('../models/Visit');
const Announcement = require('../models/Announcement');
const { DateTime } = require('luxon');

const seedData = async () => {
    try {
        const employeeCount = await Employee.countDocuments();
        const attendanceCount = await Attendance.countDocuments();
        const trainingCount = await Training.countDocuments();
        const visitCount = await Visit.countDocuments();
        const announcementCount = await Announcement.countDocuments();

        const adminEmail = 'tiwariansh626@gmail.com';
        const adminPassword = '@piyush3109';

        // 1. Ensure Admin exists
        let admin = await Admin.findOne({ email: adminEmail });
        if (!admin) {
            admin = await Admin.create({
                username: 'tiwariansh',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=tiwariansh"
            });
            console.log('Admin account created: tiwariansh626@gmail.com / @piyush3109');
        }

        // 2. Seed Employees if empty
        if (employeeCount === 0) {
            const employees = [
                {
                    name: "Arjun Sharma",
                    email: "arjun.sharma@example.in",
                    phone: "9812345670",
                    employeeId: "EMP001",
                    address: "123, MG Road, Jaipur, Rajasthan",
                    position: "Manager",
                    salaryRate: 1500,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Ramesh Sharma", phone: "9800000001", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
                    role: "manager"
                },
                {
                    name: "Pooja Mishra",
                    email: "pooja.mishra@example.in",
                    phone: "9899988776",
                    employeeId: "EMP008",
                    address: "Kankarbagh, Patna, Bihar",
                    position: "Helper",
                    salaryRate: 500,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Rajesh Mishra", phone: "9800000008", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja",
                    role: "employee"
                }
            ];
            await Employee.insertMany(employees);
            console.log('Seeded employees into the database.');
        }

        // 3. Seed Attendance
        if (attendanceCount === 0) {
            const allEmployees = await Employee.find({});
            const startDate = DateTime.now().startOf('month');
            const today = DateTime.now().day;
            const records = [];
            for (let day = 0; day < today; day++) {
                const currentDate = startDate.plus({ days: day });
                allEmployees.forEach(emp => {
                    records.push({
                        employee: emp._id,
                        status: Math.random() > 0.1 ? 'Present' : 'Absent',
                        date: currentDate.toJSDate(),
                        workingHours: 8
                    });
                });
            }
            if (records.length > 0) await Attendance.insertMany(records);
            console.log('Seeded attendance records.');
        }

        // 4. Seed Trainings
        if (trainingCount === 0) {
            await Training.create([
                {
                    title: "Advanced Safety Protocol",
                    description: "Comprehensive training on workplace safety and emergency response.",
                    trainer: "Capt. Rajesh",
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 86400000 * 7),
                    status: "Upcoming",
                    skillTaught: "Safety Management",
                    level: "Advanced"
                },
                {
                    title: "Force Communication",
                    description: "Radio and digital communication standards.",
                    trainer: "Lt. Sneha",
                    startDate: new Date(Date.now() - 86400000 * 2),
                    endDate: new Date(Date.now() + 86400000 * 2),
                    status: "In-Progress",
                    skillTaught: "Technical Comm",
                    level: "Intermediate"
                }
            ]);
            console.log('Seeded training programs.');
        }

        // 5. Seed Visits
        if (visitCount === 0) {
            const emp = await Employee.findOne({ role: 'employee' });
            if (emp) {
                await Visit.create([
                    {
                        employee: emp._id,
                        clientName: "North Sector Warehouse",
                        location: { address: "Industrial Area Phase 2", coordinates: [75.7873, 26.9124] },
                        purpose: "Security Audit",
                        status: "Completed"
                    },
                    {
                        employee: emp._id,
                        clientName: "City Command Center",
                        location: { address: "Central Mall Road", coordinates: [75.8189, 26.9154] },
                        purpose: "Maintenance Check",
                        status: "Ongoing"
                    }
                ]);
                console.log('Seeded field visits.');
            }
        }

        // 6. Seed Announcements
        if (announcementCount === 0) {
            await Announcement.create([
                {
                    title: "New Policy Update",
                    message: "Please review the updated leave policy in the HR section.",
                    priority: "medium",
                    publishedBy: admin._id
                },
                {
                    title: "System Maintenance",
                    message: "The app will be offline for 2 hours this Sunday.",
                    priority: "high",
                    publishedBy: admin._id
                }
            ]);
            console.log('Seeded announcements.');
        }

    } catch (error) {
        console.error('Data seeding failed:', error.message);
    }
};

module.exports = seedData;
