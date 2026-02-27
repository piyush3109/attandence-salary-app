const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('../models/Employee');

dotenv.config({ path: '../.env' });

const seedEmployees = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-app');

        // Clear existing employees if needed (optional)
        // await Employee.deleteMany({});

        const positions = ['Developer', 'Designer', 'Manager', 'Accountant', 'Worker', 'Clerk'];
        const types = ['per_day', 'per_hour'];

        const employees = [];
        for (let i = 1; i <= 50; i++) {
            employees.push({
                name: `Temporary Worker ${i}`,
                phone: `9876543${String(i).padStart(3, '0')}`,
                position: positions[Math.floor(Math.random() * positions.length)],
                salaryRate: Math.floor(Math.random() * (2000 - 500 + 1)) + 500,
                rateType: types[Math.floor(Math.random() * types.length)],
                email: `worker${i}@example.com`,
                role: 'employee',
                active: true
            });
        }

        await Employee.insertMany(employees);
        console.log('✅ Successfully seeded 50 temporary workers');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedEmployees();
