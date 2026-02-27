const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const Attendance = require('../models/Attendance');
const { DateTime } = require('luxon');

const seedData = async () => {
    try {
        const employeeCount = await Employee.countDocuments();
        const attendanceCount = await Attendance.countDocuments();
        const adminEmail = 'tiwariansh626@gmail.com';
        const adminPassword = '@piyush3109';

        // 1. Ensure Admin exists
        const adminExists = await Admin.findOne({ email: adminEmail });
        if (!adminExists) {
            await Admin.create({
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
                // ... (existing 20 employees)
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
                    name: "Priya Patel",
                    email: "priya.patel@example.in",
                    phone: "9834567890",
                    employeeId: "EMP002",
                    address: "45, Satellite Area, Ahmedabad, Gujarat",
                    position: "Accountant",
                    salaryRate: 1200,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Sunita Patel", phone: "9800000002", relation: "Mother" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
                    role: "manager"
                },
                {
                    name: "Rahul Verma",
                    email: "rahul.verma@example.in",
                    phone: "9876543210",
                    employeeId: "EMP003",
                    address: "Sector 15, Gurgaon, Haryana",
                    position: "Supervisor",
                    salaryRate: 1000,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Amit Verma", phone: "9800000003", relation: "Brother" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
                    role: "manager"
                },
                {
                    name: "Sneha Reddy",
                    email: "sneha.reddy@example.in",
                    phone: "9823456781",
                    employeeId: "EMP004",
                    address: "Banjara Hills, Hyderabad, Telangana",
                    position: "Clerk",
                    salaryRate: 800,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Venkatesh Reddy", phone: "9800000004", relation: "Uncle" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
                    role: "employee"
                },
                {
                    name: "Vikram Singh",
                    email: "vikram.singh@example.in",
                    phone: "9811122334",
                    employeeId: "EMP005",
                    address: "Model Town, Ludhiana, Punjab",
                    position: "Driver",
                    salaryRate: 600,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Baljit Singh", phone: "9800000005", relation: "Friend" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
                    role: "employee"
                },
                {
                    name: "Anjali Gupta",
                    email: "anjali.gupta@example.in",
                    phone: "9855566778",
                    employeeId: "EMP006",
                    address: "Civil Lines, Kanpur, Uttar Pradesh",
                    position: "Clerk",
                    salaryRate: 750,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Suresh Gupta", phone: "9800000006", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali",
                    role: "employee"
                },
                {
                    name: "Karan Malhotra",
                    email: "karan.malhotra@example.in",
                    phone: "9844433221",
                    employeeId: "EMP007",
                    address: "Andheri West, Mumbai, Maharashtra",
                    position: "Technician",
                    salaryRate: 1100,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Meena Malhotra", phone: "9800000007", relation: "Mother" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan",
                    role: "employee"
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
                },
                {
                    name: "Sandeep Yadav",
                    email: "sandeep.yadav@example.in",
                    phone: "9877766554",
                    employeeId: "EMP009",
                    address: "DLF Phase 3, Gurgaon, Haryana",
                    position: "Security Guard",
                    salaryRate: 650,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Om Prakash", phone: "9800000009", relation: "Uncle" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sandeep",
                    role: "employee"
                },
                {
                    name: "Aman Deep",
                    email: "aman.deep@example.in",
                    phone: "9866655443",
                    employeeId: "EMP010",
                    address: "Salt Lake, Kolkata, West Bengal",
                    position: "Electrician",
                    salaryRate: 950,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Kirpal Singh", phone: "9800000010", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aman",
                    role: "employee"
                },
                {
                    name: "Deepika Padukone",
                    email: "deepika.p@example.in",
                    phone: "9800011122",
                    employeeId: "EMP011",
                    address: "Indiranagar, Bangalore, Karnataka",
                    position: "Designer",
                    salaryRate: 1800,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Prakash P", phone: "9800000011", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deepika",
                    role: "employee"
                },
                {
                    name: "Ranveer Singh",
                    email: "ranveer.s@example.in",
                    phone: "9822233344",
                    employeeId: "EMP012",
                    address: "Bandra, Mumbai, Maharashtra",
                    position: "Marketing",
                    salaryRate: 1600,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Jagjit Singh", phone: "9800000012", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ranveer",
                    role: "employee"
                },
                {
                    name: "Alia Bhatt",
                    email: "alia.b@example.in",
                    phone: "9833344455",
                    employeeId: "EMP013",
                    address: "Juhu, Mumbai, Maharashtra",
                    position: "Public Relations",
                    salaryRate: 1400,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Mahesh Bhatt", phone: "9800000013", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alia",
                    role: "employee"
                },
                {
                    name: "Varun Dhawan",
                    email: "varun.d@example.in",
                    phone: "9844455566",
                    employeeId: "EMP014",
                    address: "Chembur, Mumbai, Maharashtra",
                    position: "Sales",
                    salaryRate: 1300,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "David Dhawan", phone: "9800000014", relation: "Father" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Varun",
                    role: "employee"
                },
                {
                    name: "Katrina Kaif",
                    email: "katrina.k@example.in",
                    phone: "9855566677",
                    employeeId: "EMP015",
                    address: "Colaba, Mumbai, Maharashtra",
                    position: "Brand Ambassador",
                    salaryRate: 2000,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Vicky Kaushal", phone: "9800000015", relation: "Husband" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Katrina",
                    role: "employee"
                },
                {
                    name: "Shah Rukh Khan",
                    email: "srk@example.in",
                    phone: "9866677788",
                    employeeId: "EMP016",
                    address: "Mannat, Lands End, Bandra, Mumbai",
                    position: "Senior Manager",
                    salaryRate: 5000,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Gauri Khan", phone: "9800000016", relation: "Wife" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=SRK",
                    role: "manager"
                },
                {
                    name: "Mahendra Dhoni",
                    email: "msd@example.in",
                    phone: "9877788899",
                    employeeId: "EMP017",
                    address: "Ranchi, Jharkhand",
                    position: "Consultant",
                    salaryRate: 3000,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Sakshi Dhoni", phone: "9800000017", relation: "Wife" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=MSD",
                    role: "manager"
                },
                {
                    name: "Virat Kohli",
                    email: "virat.k@example.in",
                    phone: "9888899900",
                    employeeId: "EMP018",
                    address: "Worli, Mumbai, Maharashtra",
                    position: "Fitness Trainer",
                    salaryRate: 2500,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Anushka Sharma", phone: "9800000018", relation: "Wife" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Virat",
                    role: "employee"
                },
                {
                    name: "Rohit Sharma",
                    email: "rohit.s@example.in",
                    phone: "9899900011",
                    employeeId: "EMP019",
                    address: "Borivali, Mumbai, Maharashtra",
                    position: "Captain",
                    salaryRate: 2200,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Ritika Sajdeh", phone: "9800000019", relation: "Wife" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit",
                    role: "manager"
                },
                {
                    name: "Sachin Tendulkar",
                    email: "sachin@example.in",
                    phone: "9800022233",
                    employeeId: "EMP020",
                    address: "Bandra East, Mumbai, Maharashtra",
                    position: "Advisor",
                    salaryRate: 4000,
                    rateType: "per_day",
                    password: "@piyush3109",
                    guarantor: { name: "Anjali Tendulkar", phone: "9800000020", relation: "Wife" },
                    profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sachin",
                    role: "manager"
                }
            ];
            await Employee.insertMany(employees);
            console.log('Seeded 20 Indian employees into the database.');
        }

        // 3. Seed Attendance if empty
        if (attendanceCount === 0) {
            const allEmployees = await Employee.find({});
            const startDate = DateTime.now().startOf('month');
            const today = DateTime.now().day;
            const attendanceRecords = [];

            for (let day = 0; day < today; day++) {
                const currentDate = startDate.plus({ days: day });
                const isToday = currentDate.hasSame(DateTime.now(), 'day');

                allEmployees.forEach(emp => {
                    // Random status distribution: 80% Present, 5% Absent, 15% various leaves
                    const rand = Math.random();
                    let status = 'Present';
                    if (rand < 0.05) status = 'Absent';
                    else if (rand < 0.10) status = 'Sick Leave';
                    else if (rand < 0.15) status = 'Paid Leave';
                    else if (rand < 0.20) status = 'Unpaid Leave';

                    // If it's today, make most people "Present" for the dashboard to look good
                    if (isToday && rand < 0.9) status = 'Present';

                    attendanceRecords.push({
                        employee: emp._id,
                        status,
                        date: currentDate.toJSDate(),
                        workingHours: status === 'Present' ? 8 : (['Paid Leave', 'Sick Leave'].includes(status) ? 8 : 0)
                    });
                });
            }

            if (attendanceRecords.length > 0) {
                await Attendance.insertMany(attendanceRecords);
                console.log(`Seeded ${attendanceRecords.length} attendance records for the current month.`);
            }
        }
    } catch (error) {
        console.error('Data seeding failed:', error.message);
    }
};

module.exports = seedData;
