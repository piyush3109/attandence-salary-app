const { auth, db } = require('../config/firebase');

const syncEmployeeToFirebase = async (employee) => {
    try {
        if (!auth || !db) {
            console.warn('Firebase sync skipped: Firebase Admin not fully initialized');
            return;
        }

        // 1. Sync to Auth if email exists
        if (employee.email) {
            try {
                // Check if user exists in Firebase Auth
                let fbUser;
                try {
                    fbUser = await auth.getUserByEmail(employee.email);
                } catch (e) {
                    // Create if doesn't exist
                    fbUser = await auth.createUser({
                        email: employee.email,
                        password: employee.password || 'temp_pass_123', // Minimum 6 chars
                        displayName: employee.name,
                        phoneNumber: employee.phone ? `+91${employee.phone.replace(/\s+/g, '')}` : undefined
                    });
                }
            } catch (authError) {
                console.warn('Firebase Auth sync warning:', authError.message);
            }
        }

        // 2. Sync to Firestore
        await db.collection('employees').doc(employee._id.toString()).set({
            employeeId: employee.employeeId,
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            role: employee.role,
            salaryRate: employee.salaryRate,
            rateType: employee.rateType,
            active: employee.active,
            updatedAt: new Date(),
            source: 'mongodb-sync'
        }, { merge: true });

        console.log(`Successfully synced ${employee.name} to Firebase.`);
    } catch (error) {
        console.error('Firebase Sync Error details:', error);
    }
};

module.exports = { syncEmployeeToFirebase };
