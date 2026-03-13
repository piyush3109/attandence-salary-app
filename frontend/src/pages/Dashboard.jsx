import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import {
    Users,
    UserCheck,
    UserMinus,
    Wallet,
    ArrowUpRight,
    TrendingDown,
    TrendingUp,
    CalendarCheck,
    Clock,
    BadgeIndianRupee,
    User,
    MessageSquare,
    ClipboardList,
    Briefcase,
    Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminAnalytics from '../components/dashboard/AdminAnalytics';
import AnnouncementsBoard from '../components/dashboard/AnnouncementsBoard';
import VoiceAssistant from '../components/dashboard/VoiceAssistant';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, link, index }) => {
    const CardContent = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -5, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            className="card p-4 md:p-6 relative overflow-hidden group transition-all duration-300 h-full"
        >
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
                    <p className="text-xl md:text-3xl font-black mt-2 dark:text-white flex items-baseline gap-1">
                        {value}
                    </p>
                    {trend && (
                        <div className={`flex items-center gap-1 mt-3 md:mt-4 text-[10px] font-black px-2.5 py-1 rounded-full w-fit uppercase tracking-wider ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trendValue}
                        </div>
                    )}
                </div>
                <div className={`p-3 md:p-4 rounded-2xl ${color} transform group-hover:rotate-6 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
            </div>
            {link && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
            )}
        </motion.div>
    );

    return link ? <Link to={link}>{CardContent}</Link> : CardContent;
};

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard/stats');
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats');
            }
        };
        fetchStats();

        const socket = getSocket();
        if (socket) {
            socket.on('attendance_update', fetchStats);
            socket.on('employee_joined', fetchStats);
            socket.on('task_update', fetchStats);
            socket.on('salary_update', fetchStats);
        }

        return () => {
            if (socket) {
                socket.off('attendance_update', fetchStats);
                socket.off('employee_joined', fetchStats);
                socket.off('task_update', fetchStats);
                socket.off('salary_update', fetchStats);
            }
        };
    }, []);

    if (!stats) return <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>;

    const isAdmin = user?.role !== 'employee';

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 px-2 md:px-0"
            >
                <div>
                    <h1 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                        {isAdmin ? 'Dashboard' : 'My Dashboard'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 md:mt-3 text-sm md:text-lg font-medium">
                        Welcome back, <span className="text-primary-600 dark:text-primary-400 font-black uppercase">{user?.username}</span>!
                        {isAdmin ? " Here's your overview for today." : " Here's your personal overview."}
                    </p>
                </div>
                <div className="inline-flex">
                    <div className="bg-white dark:bg-gray-800 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/40" />
                        <span className="text-[10px] md:text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">{format(new Date(), 'EEEE, dd MMMM')}</span>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {isAdmin ? (
                    <>
                        <StatCard
                            title="Total Employees"
                            value={stats.totalEmployees}
                            icon={Users}
                            color="bg-gradient-to-br from-blue-500 to-indigo-700 shadow-blue-500/20"
                            trend="up"
                            trendValue="+2 this month"
                            link="/employees"
                            index={0}
                        />
                        <StatCard
                            title="Present Today"
                            value={stats.presentToday}
                            icon={UserCheck}
                            color="bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20"
                            link="/attendance"
                            index={1}
                        />
                        <StatCard
                            title="Absent Today"
                            value={stats.absentToday}
                            icon={UserMinus}
                            color="bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-500/20"
                            link="/attendance"
                            index={2}
                        />
                        <StatCard
                            title="Est. Payroll"
                            value={`₹${stats.estimatedSalary?.toLocaleString()}`}
                            icon={Wallet}
                            color="bg-gradient-to-br from-amber-500 to-orange-700 shadow-amber-500/20"
                            trend="up"
                            trendValue="On track"
                            link="/salary"
                            index={3}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Duty Days"
                            value={stats.presentDays}
                            icon={UserCheck}
                            color="bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20"
                            link="/my-attendance"
                            index={0}
                        />
                        <StatCard
                            title="Leaves"
                            value={stats.leaves}
                            icon={CalendarCheck}
                            color="bg-gradient-to-br from-blue-500 to-indigo-700 shadow-blue-500/20"
                            link="/my-attendance"
                            index={1}
                        />
                        <StatCard
                            title="Hours"
                            value={`${stats.totalHours}h`}
                            icon={Clock}
                            color="bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-500/20"
                            index={2}
                        />
                        <StatCard
                            title="Working Days"
                            value={stats.workingDays}
                            icon={Users}
                            color="bg-gradient-to-br from-amber-500 to-orange-700 shadow-amber-500/20"
                            index={3}
                        />
                    </>
                )}
            </div>

            {isAdmin && (
                <div className="mb-4 md:mb-8">
                    <AdminAnalytics />
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="lg:col-span-2 space-y-4 md:space-y-8">
                    {/* Admin: Live Status */}
                    {isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="card p-5 md:p-8"
                        >
                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <h3 className="text-lg md:text-xl font-black dark:text-white flex items-center gap-3 tracking-tight">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Today's Attendance
                                </h3>
                                <Link to="/attendance" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">View All</Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                {stats.presentToday > 0 ? (
                                    <>
                                        {[...Array(Math.min(stats.presentToday, 6))].map((_, i) => (
                                            <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl md:rounded-2xl border border-gray-100 dark:border-gray-800 group hover:border-emerald-500/30 transition-all">
                                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                    <User className="w-4 h-4 md:w-5 md:h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs md:text-sm font-black dark:text-white truncate">Employee {i + 1}</div>
                                                    <div className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Present</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="sm:col-span-2 py-10 md:py-12 text-center space-y-4">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto">
                                            <Users className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black dark:text-white uppercase tracking-widest">No Attendance Yet</p>
                                            <p className="text-xs text-gray-500 mt-1">Mark today's attendance to see status</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Employee: Quick Summary Card */}
                    {!isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="card p-5 md:p-8"
                        >
                            <h3 className="text-lg md:text-xl font-black dark:text-white flex items-center gap-3 tracking-tight mb-6">
                                <User className="w-5 h-5 text-primary-500" />
                                My Summary
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Attendance Rate</p>
                                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                                        {stats.workingDays > 0 ? Math.round((stats.presentDays / stats.workingDays) * 100) : 0}%
                                    </p>
                                    <p className="text-xs text-emerald-600/70 mt-1 font-medium">{stats.presentDays} of {stats.workingDays} days</p>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">This Month</p>
                                    <p className="text-3xl font-black text-blue-700 dark:text-blue-400">{stats.totalHours}h</p>
                                    <p className="text-xs text-blue-600/70 mt-1 font-medium">Total hours logged</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <AnnouncementsBoard />

                    {/* Quick Links */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6"
                    >
                        {isAdmin ? (
                            <>
                                <QuickLink to="/attendance" icon={CalendarCheck} title="Mark Attendance" subtitle="Daily attendance log" color="primary" />
                                <QuickLink to="/advance" icon={BadgeIndianRupee} title="Advance" subtitle="Manage advance payments" color="emerald" />
                                <QuickLink to="/tasks" icon={ClipboardList} title="Tasks" subtitle="Manage team tasks" color="amber" />
                                <QuickLink to="/messages" icon={MessageSquare} title="Messages" subtitle="Internal communication" color="blue" />
                            </>
                        ) : (
                            <>
                                <QuickLink to="/my-attendance" icon={CalendarCheck} title="My Attendance" subtitle="View attendance history" color="primary" />
                                <QuickLink to="/my-salary" icon={Wallet} title="My Salary" subtitle="View earnings" color="emerald" />
                                <QuickLink to="/tasks" icon={ClipboardList} title="My Tasks" subtitle="View assigned tasks" color="amber" />
                                <QuickLink to="/messages" icon={MessageSquare} title="Messages" subtitle="Chat with team" color="blue" />
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-4 md:space-y-8">
                    {/* Quick Profile Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="card p-5 md:p-8 bg-gradient-to-br from-primary-600 to-indigo-800 text-white border-none shadow-2xl shadow-primary-500/20 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 md:mb-6 overflow-hidden border-2 border-white/20">
                                {user?.profilePhoto ? (
                                    <img
                                        src={user.profilePhoto}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl md:text-3xl font-black">{user?.username?.charAt(0)?.toUpperCase()}</span>
                                )}
                            </div>
                            <motion.h3 layout className="text-lg md:text-xl font-black mb-1">{user?.username}</motion.h3>
                            <p className="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] mb-4">{user?.role}</p>
                            <Link
                                to={user?.role === 'employee' ? '/my-profile' : '/profile'}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                            >
                                <User className="w-3.5 h-3.5" />
                                View Profile
                            </Link>
                        </div>
                    </motion.div>

                    {/* Notifications / Recent Activity */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-5 md:p-8"
                    >
                        <h3 className="text-lg md:text-xl font-black dark:text-white flex items-center gap-3 mb-6">
                            <Bell className="w-5 h-5 text-amber-500" />
                            Activity
                        </h3>
                        <div className="space-y-3">
                            {stats.recentActivity && stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((act, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={idx}
                                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.type === 'Attendance' ? 'bg-emerald-500/10 text-emerald-500' : act.type === 'Message' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {act.type === 'Attendance' ? <CalendarCheck className="w-4 h-4" /> : act.type === 'Message' ? <MessageSquare className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold dark:text-white truncate">{act.title}</p>
                                            <p className="text-[10px] text-gray-400">{act.subtitle}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Voice Assistant */}
            <VoiceAssistant />
        </div>
    );
};

const QuickLink = ({ to, icon: Icon, title, subtitle, color }) => (
    <motion.div variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    }}>
        <Link to={to} className={`card p-4 md:p-6 flex items-center gap-3 md:gap-4 hover:border-${color}-500/50 transition-all group`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-${color}-500/10 text-${color}-600 flex items-center justify-center group-hover:bg-${color}-500 group-hover:text-white transition-all`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
                <h4 className="text-sm md:text-base font-black text-gray-900 dark:text-white">{title}</h4>
                <p className="text-[10px] md:text-xs text-gray-500">{subtitle}</p>
            </div>
        </Link>
    </motion.div>
);

export default Dashboard;
