import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CalendarCheck,
    CalendarX,
    Clock,
    User
} from 'lucide-react';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

const cn = (...inputs) => twMerge(clsx(inputs));

const AttendanceCalendar = () => {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(user?.role === 'employee' ? user._id : '');
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role !== 'employee') {
            fetchEmployees();
        }
    }, [user]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchEmployeeAttendance();
        }
    }, [selectedEmployee, currentMonth]);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/employees');
            setEmployees(data);
            if (!selectedEmployee && data.length > 0) setSelectedEmployee(data[0]._id);
        } catch (error) {
            toast.error('Failed to fetch employees');
        }
    };

    const fetchEmployeeAttendance = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const { data } = await api.get(`/attendance/employee/${selectedEmployee}?start=${format(start, 'yyyy-MM-dd')}&end=${format(end, 'yyyy-MM-dd')}`);
            setAttendanceData(data);
        } catch (error) {
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    });

    const getStatusInfo = (day) => {
        const record = attendanceData.find(a => isSameDay(new Date(a.date), day));
        if (!record) return null;

        const colors = {
            'Present': 'bg-emerald-500',
            'Absent': 'bg-rose-500',
            'Sick Leave': 'bg-amber-500',
            'Paid Leave': 'bg-blue-500',
            'Unpaid Leave': 'bg-gray-400'
        };

        return {
            status: record.status,
            color: colors[record.status] || 'bg-gray-200',
            hours: record.workingHours
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Attendance Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Detailed monthly view for employees.</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    {user?.role !== 'employee' && (
                        <div className="flex items-center gap-2 px-3 border-r border-gray-100 dark:border-gray-700 mr-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-gray-900 dark:text-white text-sm"
                            >
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 dark:text-white" />
                    </button>
                    <div className="flex items-center gap-3 px-2 font-black text-gray-900 dark:text-white min-w-[150px] justify-center text-lg">
                        {format(currentMonth, 'MMMM yyyy')}
                    </div>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 dark:text-white" />
                    </button>
                </div>
            </div>

            {/* Smart Check-In Panel */}
            {user?.role === 'employee' && (
                <div className="card p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="text-white">
                            <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-400" />
                                Smart Check-In
                            </h3>
                            <p className="text-sm text-gray-400 font-medium">Please allow location access to mark your attendance today.</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!navigator.geolocation) {
                                    return toast.error("Geolocation is not supported by your browser");
                                }
                                setLoading(true);
                                const loadingToast = toast.loading("Acquiring GPS fix...");

                                navigator.geolocation.getCurrentPosition(async (position) => {
                                    try {
                                        const location = {
                                            latitude: position.coords.latitude,
                                            longitude: position.coords.longitude,
                                            accuracy: position.coords.accuracy
                                        };

                                        // Simple mock location heuristic (huge accuracy in Chrome dev tools)
                                        const isMockLocation = position.coords.accuracy > 50000;

                                        await api.post('/attendance', {
                                            employeeId: user._id,
                                            status: 'Present',
                                            date: new Date().toISOString(),
                                            workingHours: 8,
                                            checkInTime: new Date(),
                                            location,
                                            isMockLocation,
                                            deviceInfo: navigator.userAgent
                                        });

                                        toast.update(loadingToast, { render: "Smart Check-In Successful! 📍", type: "success", isLoading: false, autoClose: 3000 });
                                        fetchEmployeeAttendance();
                                    } catch (error) {
                                        toast.update(loadingToast, { render: error.response?.data?.message || "Check-In Failed", type: "error", isLoading: false, autoClose: 3000 });
                                    } finally {
                                        setLoading(false);
                                    }
                                }, (error) => {
                                    setLoading(false);
                                    toast.update(loadingToast, { render: "Location access denied. Cannot mark attendance.", type: "error", isLoading: false, autoClose: 3000 });
                                }, { enableHighAccuracy: true, timeout: 10000 });
                            }}
                            className="btn bg-primary-500 hover:bg-primary-600 text-white border-none shadow-lg shadow-primary-500/30 flex items-center gap-2 h-12 px-6 rounded-xl"
                            disabled={loading}
                        >
                            <User className="w-5 h-5" />
                            {loading ? 'Locating...' : 'Selfie / Geo Clock-In'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card p-8 bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-xl shadow-primary-500/20">
                        <div className="space-y-6">
                            <div>
                                <p className="text-primary-100 font-bold uppercase text-[10px] tracking-widest mb-1">Monthly Summary</p>
                                <h3 className="text-2xl font-black">Performance</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black">{attendanceData.filter(a => a.status === 'Present').length}</p>
                                    <p className="text-[10px] font-bold text-primary-100 uppercase mt-1">Present</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-black">{attendanceData.filter(a => ['Paid Leave', 'Sick Leave'].includes(a.status)).length}</p>
                                    <p className="text-[10px] font-bold text-primary-100 uppercase mt-1">Leaves</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10 uppercase font-black text-[10px] tracking-widest">
                                <span>Total Hours</span>
                                <span>{attendanceData.reduce((acc, curr) => acc + (curr.workingHours || 0), 0)}h</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-4">
                        <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Legend</h4>
                        <div className="space-y-3">
                            {[
                                { label: 'Present', color: 'bg-emerald-500' },
                                { label: 'Absent', color: 'bg-rose-500' },
                                { label: 'Paid/Sick Leave', color: 'bg-blue-500' },
                                { label: 'Unpaid Leave', color: 'bg-gray-400' }
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Calendar Grid */}
                <div className="lg:col-span-3">
                    <div className="card overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 dark:bg-gray-800/30">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day, idx) => {
                                const info = getStatusInfo(day);
                                const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');

                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "min-h-[120px] aspect-square p-4 border-r border-b border-gray-50 dark:border-gray-800 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/20 relative group overflow-hidden",
                                            !isCurrentMonth && "opacity-20 grayscale",
                                            idx % 7 === 6 && "border-r-0"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-lg font-black",
                                            isSameDay(day, new Date()) ? "text-primary-600" : "text-gray-400 dark:text-gray-500"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {info && (
                                            <div className="mt-2 space-y-1">
                                                <div className={cn(
                                                    "h-1.5 w-full rounded-full",
                                                    info.color
                                                )} />
                                                <div className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2 truncate">
                                                    {info.status}
                                                </div>
                                                {info.hours > 0 && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 dark:text-gray-500">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {info.hours}h
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isSameDay(day, new Date()) && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;
