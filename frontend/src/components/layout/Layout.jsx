import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from '../notifications/NotificationBell';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f19] flex relative overflow-hidden transition-colors duration-500">
            {/* Subtle background glow */}
            <div className="fixed top-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[20%] w-[20%] h-[20%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <Sidebar />

            {/* Top Bar with Notification Bell */}
            <div className="fixed top-4 right-4 md:right-8 z-50 flex items-center gap-3">
                <NotificationBell />
            </div>

            <main className="flex-1 lg:ml-72 p-4 md:p-10 pt-24 lg:pt-10 transition-all duration-300 relative z-10">
                <div className="max-w-7xl mx-auto min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
