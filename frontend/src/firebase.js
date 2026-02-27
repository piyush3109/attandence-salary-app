import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAebDUZn43uXytsmAgVQSAqH1omicLtzek",
    authDomain: "business-ea963.firebaseapp.com",
    projectId: "business-ea963",
    storageBucket: "business-ea963.firebasestorage.app",
    messagingSenderId: "576585977679",
    appId: "1:576585977679:web:75bc6faae9c664e3babf3a",
    measurementId: "G-XPXMJB3HME"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics - lazy loaded to avoid build errors
let analytics = null;
function initAnalytics() {
    if (typeof window !== "undefined" && !analytics) {
        try {
            import("firebase/analytics").then(({ getAnalytics }) => {
                analytics = getAnalytics(app);
            }).catch((error) => {
                console.warn("Firebase Analytics not available:", error.message);
            });
        } catch (error) {
            console.warn("Firebase Analytics not available:", error.message);
        }
    }
}
initAnalytics();

export { auth, db, analytics };
export default app;
