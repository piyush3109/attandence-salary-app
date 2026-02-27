const admin = require('firebase-admin');

// Initialize Firebase Admin
// Uses Application Default Credentials (ADC) or GOOGLE_APPLICATION_CREDENTIALS env var.
// If a service account key file path is provided via GOOGLE_APPLICATION_CREDENTIALS, it will use that.
// Otherwise, it initializes with just the projectId (limited functionality - verifyIdToken will NOT work).
if (!admin.apps.length) {
    try {
        // Attempt to initialize with full credentials (service account)
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: "business-ea963",
            });
            console.log('Firebase Admin initialized with service account credentials.');
        } else {
            // Fallback: Initialize with just projectId.
            // WARNING: verifyIdToken() and createUser() may not work without proper credentials.
            admin.initializeApp({
                projectId: "business-ea963",
            });
            console.warn(
                'Firebase Admin initialized WITHOUT service account credentials.\n' +
                'Auth operations (verifyIdToken, createUser) may fail.\n' +
                'Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account key JSON path.'
            );
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error.message);
        // Initialize a minimal app so the server doesn't crash
        if (!admin.apps.length) {
            admin.initializeApp({ projectId: "business-ea963" });
        }
    }
}

// Safe getters that won't crash if Firebase isn't fully configured
let db = null;
let authAdmin = null;

try {
    db = admin.firestore();
} catch (e) {
    console.warn('Firestore not available:', e.message);
}

try {
    authAdmin = admin.auth();
} catch (e) {
    console.warn('Firebase Auth Admin not available:', e.message);
}

module.exports = { admin, db, auth: authAdmin };
