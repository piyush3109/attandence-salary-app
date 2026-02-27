const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const Admin = require('./models/Admin');
const { syncEmployeeToFirebase } = require('./utils/firebaseSync');

dotenv.config();

const indianNames = [
    'Rahul Sharma', 'Priya Singh', 'Amit Patel', 'Sneha Reddy', 'Vikram Malhotra',
    'Anjali Gupta', 'Rajesh Iyer', 'Kavita Choudhary', 'Sanjay Verma', 'Deepa Nair',
    'Arjun Rao', 'Meera Joshi', 'Suresh Kumar', 'Sunita Devi', 'Vijay Yadav',
    'Ritu Phogat', 'Manish Pandey', 'Pooja Hegde', 'Karan Johar', 'Shikha Singh',
    'Alok Mishra', 'Neha Kakkar', 'Rohan Mehra', 'Ishita Dutta', 'Varun Dhawan',
    'Aditi Rao', 'Prakash Raj', 'Swati Maliwal', 'Abhishek Bachchan', 'Kriti Sanon',
    'Manoj Bajpayee', 'Radhika Apte', 'Pankaj Tripathi', 'Aishwarya Rai', 'Hritik Roshan',
    'Deepika Padukone', 'Ranveer Singh', 'Anushka Sharma', 'Virat Kohli', 'Rohit Sharma',
    'MS Dhoni', 'Sachin Tendulkar', 'Saina Nehwal', 'Mary Kom', 'P.V. Sindhu',
    'Sanmathi Shetty', 'Gautam Gambhir', 'Yuvraj Singh', 'Harbhajan Singh', 'Zahir Khan'
];

const positions = ['Driver', 'Logistics Manager', 'Accountant', 'Fleet Supervisor', 'Loader', 'Security', 'CEO Assistant'];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Cloud.');

        // 1. Ensure Admins are set
        const adminEmail = 'tiwariansh626@gmail.com';
        let mainAdmin = await Admin.findOne({ email: adminEmail });
        if (!mainAdmin) {
            await Admin.create({
                username: 'tiwariansh',
                email: adminEmail,
                password: '@piyush3109',
                role: 'admin'
            });
            console.log('Main Admin Created.');
        }

        // 2. Generate 50 Employees
        console.log('Generating 50 Indian Employees...');
        const employeesToInsert = [];

        for (let i = 0; i < 50; i++) {
            const name = indianNames[i % indianNames.length];
            const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(100 + Math.random() * 900)}@transport.com`;
            const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
            const empId = `EMP${1000 + i}`;

            employeesToInsert.push({
                name,
                email,
                phone,
                password: 'password123',
                employeeId: empId,
                position: positions[Math.floor(Math.random() * positions.length)],
                role: i < 5 ? 'manager' : 'employee', // First 5 are managers
                salaryRate: Math.floor(500 + Math.random() * 2000),
                rateType: 'per_day',
                address: `${Math.floor(1 + Math.random() * 100)}, Transport Nagar, New Delhi`,
                active: true,
                profilePhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            });
        }

        // Clean existing (Careful!)
        // await Employee.deleteMany({}); 

        const createdEmployees = await Employee.insertMany(employeesToInsert);
        console.log(`Successfully added ${createdEmployees.length} employees to MongoDB.`);

        // 3. Sync to Firebase (Batch)
        console.log('Syncing to Firebase (this might take a minute)...');
        for (const emp of createdEmployees) {
            await syncEmployeeToFirebase(emp);
        }

        console.log('Seed Complete! 50 Users added and synced.');
        process.exit(0);
    } catch (error) {
        console.error('Seed Failed:', error);
        process.exit(1);
    }
};

seed();
