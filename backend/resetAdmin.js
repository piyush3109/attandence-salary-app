const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const email = 'tiwariansh626@gmail.com';
        const password = '@piyush3109';
        const username = 'tiwariansh';

        let admin = await Admin.findOne({ email });

        if (admin) {
            admin.password = password;
            admin.username = username;
            await admin.save();
            console.log('Existing Admin password updated successfully.');
        } else {
            await Admin.create({
                username,
                email,
                password,
                role: 'admin'
            });
            console.log('New Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Operation failed:', error);
        process.exit(1);
    }
};

resetAdmin();
