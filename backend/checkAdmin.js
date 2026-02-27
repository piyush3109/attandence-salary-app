const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');
dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_salary_db');
        const admins = await Admin.find({});
        console.log('Admins found:', admins);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
checkAdmin();
