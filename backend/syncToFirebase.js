const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const { syncEmployeeToFirebase } = require('./utils/firebaseSync');

dotenv.config();

const syncAll = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const employees = await Employee.find({ active: true });
        console.log(`Found ${employees.length} employees to sync.`);

        for (const emp of employees) {
            console.log(`Syncing ${emp.name}...`);
            await syncEmployeeToFirebase(emp);
        }

        console.log('Sync completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
};

syncAll();
