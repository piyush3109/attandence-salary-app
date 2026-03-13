import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import InstallPrompt from './components/pwa/InstallPrompt';
import PageTransition from './components/layout/PageTransition';

// ─── Lazy Loaded Pages ───
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees'));
const Attendance = lazy(() => import('./pages/Attendance'));
const AttendanceCalendar = lazy(() => import('./pages/AttendanceCalendar'));
const Salary = lazy(() => import('./pages/Salary'));
const Advance = lazy(() => import('./pages/Advance'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const MySalary = lazy(() => import('./pages/MySalary'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Messages = lazy(() => import('./pages/Messages'));
const Developers = lazy(() => import('./pages/Developers'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Ops = lazy(() => import('./pages/Ops'));
const Groups = lazy(() => import('./pages/Groups'));

// ─── Loading Spinner ────────────────────────────────────
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
        </div>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<PageTransition><Dashboard /></PageTransition>} />
                    <Route path="employees" element={<PageTransition><Employees /></PageTransition>} />
                    <Route path="tasks" element={<PageTransition><Tasks /></PageTransition>} />
                    <Route path="messages" element={<PageTransition><Messages /></PageTransition>} />
                    <Route path="groups" element={<PageTransition><Groups /></PageTransition>} />
                    <Route path="attendance" element={<PageTransition><Attendance /></PageTransition>} />
                    <Route path="calendar" element={<PageTransition><AttendanceCalendar /></PageTransition>} />
                    <Route path="leaves" element={<PageTransition><Leaves /></PageTransition>} />
                    <Route path="ops" element={<PageTransition><Ops /></PageTransition>} />
                    <Route path="salary" element={<PageTransition><Salary /></PageTransition>} />
                    <Route path="advance" element={<PageTransition><Advance /></PageTransition>} />
                    <Route path="settings" element={<PageTransition><Settings /></PageTransition>} />
                    <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
                    <Route path="developers" element={<PageTransition><Developers /></PageTransition>} />

                    {/* Employee specific routes */}
                    <Route path="my-profile" element={<PageTransition><Profile /></PageTransition>} />
                    <Route path="my-attendance" element={<PageTransition><AttendanceCalendar /></PageTransition>} />
                    <Route path="my-salary" element={<PageTransition><MySalary /></PageTransition>} />
                </Route>
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="bg-gray-50 dark:bg-[#0b0f19] min-h-screen transition-colors duration-500">
                    <Suspense fallback={<PageLoader />}>
                        <AnimatedRoutes />
                    </Suspense>
                </div>

                <InstallPrompt />
                <ToastContainer position="bottom-right" theme="colored" autoClose={3000} limit={3} />
            </AuthProvider>
        </Router>
    );
}

export default App;
