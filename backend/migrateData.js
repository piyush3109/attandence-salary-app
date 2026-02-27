const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import all models
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Advance = require('./models/Advance');
const Task = require('./models/Task');
const Message = require('./models/Message');

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/attendance_salary_db';
const ATLAS_URI = process.env.MONGODB_URI;

const migrate = async () => {
    try {
        if (ATLAS_URI.includes('your-cluster-url')) {
            console.error('ERROR: You must replace "your-cluster-url" in backend/.env with your actual Atlas cluster URL first.');
            process.exit(1);
        }

        console.log('Connecting to Local MongoDB...');
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('Connected to Local.');

        console.log('Connecting to Atlas MongoDB...');
        const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log('Connected to Atlas.');

        const models = [
            { name: 'Admin', schema: Admin.schema },
            { name: 'Employee', schema: Employee.schema },
            { name: 'Attendance', schema: Attendance.schema },
            { name: 'Advance', schema: Advance.schema },
            { name: 'Task', schema: Task.schema },
            { name: 'Message', schema: Message.schema }
        ];

        for (const m of models) {
            console.log(`Migrating ${m.name} data...`);

            const LocalModel = localConn.model(m.name, m.schema);
            const AtlasModel = atlasConn.model(m.name, m.schema);

            const data = await LocalModel.find({});
            console.log(`Found ${data.length} records in ${m.name}.`);

            if (data.length > 0) {
                // Clear Atlas collection first to avoid duplicates
                await AtlasModel.deleteMany({});
                await AtlasModel.insertMany(data);
                console.log(`Successfully moved ${m.name} to Atlas.`);
            }
        }

        console.log('Migration Complete! All data is now in MongoDB Atlas.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
