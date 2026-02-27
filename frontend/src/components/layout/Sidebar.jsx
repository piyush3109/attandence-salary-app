import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    IndianRupee,
    CreditCard,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    Settings,
    UserCircle,
    Calendar,
    BadgeIndianRupee,
    MessageSquare,
    Briefcase,
    ClipboardList,
    Code2,
    Shield,
    GraduationCap,
    MapPin,
    Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../utils/api';

const cn = (...inputs) => twMerge(clsx(inputs));

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // First check user profile theme, then local storage, then system pref
        const savedTheme = user?.theme || localStorage.theme;
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        }
    }, [user]);

    const toggleDarkMode = async () => {
        const newTheme = !isDark ? 'dark' : 'light';
        if (!isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
        setIsDark(!isDark);

        try {
            await api.put('/auth/theme', { theme: newTheme });
        } catch (error) {
            console.error('Failed to sync theme preference');
        }
    };

    const allNavItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'ceo', 'manager', 'accountant'] },
        { name: 'Employees', icon: Users, path: '/employees', roles: ['admin', 'ceo', 'manager'] },
        { name: 'Work Hub', icon: Briefcase, path: '/tasks', roles: ['admin', 'ceo', 'manager', 'employee'] },
        { name: 'Messages', icon: MessageSquare, path: '/messages', roles: ['admin', 'ceo', 'manager', 'employee'] },
        { name: 'Attendance', icon: CalendarCheck, path: '/attendance', roles: ['admin', 'ceo', 'manager'] },
        { name: 'Calendar View', icon: Calendar, path: '/calendar', roles: ['admin', 'ceo', 'manager'] },
        { name: 'Leaves', icon: ClipboardList, path: '/leaves', roles: ['admin', 'ceo', 'manager', 'employee', 'hr'] },
        { name: 'Strategic Ops', icon: Activity, path: '/ops', roles: ['admin', 'ceo', 'manager', 'employee'] },
        { name: 'Salary', icon: IndianRupee, path: '/salary', roles: ['admin', 'ceo', 'accountant'] },
        { name: 'Advance', icon: CreditCard, path: '/advance', roles: ['admin', 'ceo', 'accountant'] },
        // Employee Specific Routes
        { name: 'My Profile', icon: UserCircle, path: '/my-profile', roles: ['employee'] },
        { name: 'My Attendance', icon: Calendar, path: '/my-attendance', roles: ['employee'] },
        { name: 'My Salary', icon: BadgeIndianRupee, path: '/my-salary', roles: ['employee'] },
        { name: 'Developers', icon: Code2, path: '/developers', roles: ['admin', 'ceo', 'manager', 'employee', 'accountant'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role || 'admin'));

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <button
                className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md lg:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-500 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="p-8">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:rotate-12 transition-transform duration-300">
                                <IndianRupee className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="tracking-tight text-lg">Employ</span>
                                <span className="text-primary-600 text-xs font-black uppercase tracking-widest">Management App</span>
                            </div>
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
                        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] px-4 mb-4 mt-2">Main Menu</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-300 group",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 hover:translate-x-1"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    "group-hover:text-primary-500"
                                )} />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div
                            onClick={() => navigate(user?.role === 'employee' ? '/my-profile' : '/profile')}
                            className="bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] p-4 mb-4 border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 overflow-hidden flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm group-hover:scale-105 transition-transform">
                                    {user?.profilePhoto ? (
                                        <img src={user.profilePhoto} alt={user.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-primary-600 font-black text-lg">
                                            {user?.username?.charAt(0).toUpperCase() || 'A'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors uppercase">{user?.username || 'User'}</p>
                                    <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest leading-none mt-0.5">{user?.role || 'Admin'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={toggleDarkMode}
                                className="flex-1 flex items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-800"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="flex-1 flex items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-800"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100/50 dark:border-red-900/20"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
