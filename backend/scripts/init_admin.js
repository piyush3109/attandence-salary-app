const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const initAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected to initialize admin...');

        const adminData = {
            username: 'tiwariansh',
            email: 'tiwariansh626@gmail.com',
            password: '@piyush3109',
            role: 'admin'
        };

        const existingAdmin = await Admin.findOne({ email: adminData.email });

        if (existingAdmin) {
            existingAdmin.password = adminData.password; // This will be hashed by pre-save hook
            existingAdmin.username = adminData.username;
            await existingAdmin.save();
            console.log('Admin user updated successfully.');
        } else {
            await Admin.create(adminData);
            console.log('Admin user created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error initializing admin:', error.message);
        process.exit(1);
    }
};

initAdmin();
