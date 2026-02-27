const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const studentNames = [
    "HARSHITA RAJ", "HIMANSHU KUMAR TIWARI", "HIMANSHU RAJ", "ISHA KUMARI",
    "JAHNVI JAISWAL", "JAI SHRIRAM TIWARI", "JAYDEV KUMAR", "JYOTI KUMARI",
    "KAJAL KUMARI", "KARTIK SHUKLA", "KAVITA KUMARI", "KOMAL RANI",
    "KRISH RAJ", "KRISHNA KUMAR", "KRISHNA NAND GUPTA", "LUCKY KUMAR GUPTA",
    "MAHENDRA KUMAR YADAV", "MAHIMA SINGH", "MANJEET KUMAR YADAV",
    "MD FARHAN ANSARI", "MD KAIF", "MD KAIF", "MEGHA KUMARI", "MEHDI HASAN",
    "MOHAMMAD SADAB", "MOHIT YADAV", "MURARI KUMAR SHARMA", "NAVIN KUMAR",
    "NIRAJ KUMAR", "NITESH KUMAR SHARMA", "OMKAR TIWARI", "PANKAJ KUMAR YADAV",
    "PARIMA SINGH", "PAWAN TIWARI", "PINTU KUMAR", "PIYUSH KUMAR MISHRA",
    "PIYUSH TIWARI", "PRAKASH KUMAR", "PRAKHAR TRIPATHI", "PRASHANT KUMAR YADAV",
    "PRATIMA CHAURASIA", "PRINCE KUMAR", "PRINCE KUMAR", "PRINCE KUMAR CHAURASIA",
    "PRIYA JAISWAL", "PRIYANKA YADAV", "PRIYANSHU KUMAR", "RAHUL KUMAR YADAV",
    "RAHUL RAJ", "RAJ KUMAR SAH", "RAJ KUSHWAHA", "RAJ LAXMI", "RAJA BABU",
    "RAM BAHADUR GUPTA", "RANJAN KUMAR", "RAUSHAN KUMAR", "RAVIKANT SINGH",
    "REYAZ ALAM ANSARI", "RISHI", "RISHIRAJ", "RITURAJ BHARDWAJ",
    "ROHIT YADAV", "RUDRA PRATAP RAI", "SAHIL KHAN"
];

const seedEmployees = async () => {
    try {
        console.log('Clearing old fake users (if any)...');
        await Employee.deleteMany({ position: 'Fake Profile' });

        const employeesToInsert = studentNames.map((name, index) => {
            const uniqueId = `EMP-F-${Math.floor(Math.random() * 10000)}-${Date.now().toString().slice(-4)}-${index}`;
            const uniquePhone = `99${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
            const username = name.toLowerCase().replace(/\s+/g, '') + index;

            return {
                employeeId: uniqueId,
                name: name,
                orgId: 'ORG-HYBRID-MAIN',
                phone: uniquePhone,
                email: `${username}@example.com`,
                password: 'password123',
                position: 'Fake Profile',
                salaryRate: 500,
                rateType: 'per_day',
                role: 'employee',
                active: true,
                contractType: 'Full-time'
            };
        });

        console.log(`Hashing passwords for ${employeesToInsert.length} users...`);
        const salt = await bcrypt.genSalt(10);

        for (let emp of employeesToInsert) {
            emp.password = await bcrypt.hash(emp.password, salt);
        }

        console.log('Inserting bulk records...');
        await Employee.insertMany(employeesToInsert);

        console.log('Successfully seeded employees!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:');
        console.error(error);
        process.exit(1);
    }
};

seedEmployees();
