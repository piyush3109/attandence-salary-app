import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';

// ─── Lazy Loaded Pages (code-splitting for fast initial load) ───
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

// ─── Loading Spinner ────────────────────────────────────
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
        </div>
    </div>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="employees" element={<Employees />} />
                            <Route path="tasks" element={<Tasks />} />
                            <Route path="messages" element={<Messages />} />
                            <Route path="attendance" element={<Attendance />} />
                            <Route path="calendar" element={<AttendanceCalendar />} />
                            <Route path="leaves" element={<Leaves />} />
                            <Route path="ops" element={<Ops />} />
                            <Route path="salary" element={<Salary />} />
                            <Route path="advance" element={<Advance />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="developers" element={<Developers />} />

                            {/* Employee specific routes */}
                            <Route path="my-profile" element={<Profile />} />
                            <Route path="my-attendance" element={<AttendanceCalendar />} />
                            <Route path="my-salary" element={<MySalary />} />
                        </Route>
                    </Routes>
                </Suspense>
                <ToastContainer position="bottom-right" theme="colored" autoClose={3000} limit={3} />
            </AuthProvider>
        </Router>
    );
}

export default App;
