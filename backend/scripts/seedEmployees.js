const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_salary_db';

const employeesData = [
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Karan"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sandeep"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aman"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deepika"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ranveer"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alia"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Varun"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Katrina"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=SRK"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=MSD"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Virat"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit"
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
        profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sachin"
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing employees
        await Employee.deleteMany({});
        console.log('Cleared existing employees.');

        // Insert new employees
        await Employee.insertMany(employeesData);
        console.log(`Successfully seeded ${employeesData.length} Indian employees.`);

        // Setup Admin
        const adminEmail = 'tiwariansh626@gmail.com';
        const adminPassword = '@piyush3109';

        await Admin.deleteMany({ email: adminEmail });
        await Admin.create({
            username: 'tiwariansh',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            profilePhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=tiwariansh"
        });
        console.log('Admin account setup successfully.');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
