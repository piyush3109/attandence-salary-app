import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { getSocket } from '../utils/socket';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Save,
    FileDown,
    Loader2,
    Check,
    List,
    LayoutGrid,
    Target
} from 'lucide-react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';

const cn = (...inputs) => twMerge(clsx(inputs));

const Attendance = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'calendar'
    const [date, setDate] = useState(new Date());
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);

    // Calendar specific state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [history, setHistory] = useState([]);
    const [tasks, setTasks] = useState([]);

    const isEditingAllowed = ['admin', 'manager', 'ceo'].includes(user?.role);

    useEffect(() => {
        fetchEmployeesAndAttendance();
        if (viewMode === 'calendar') {
            fetchCalendarData();
        }

        const socket = getSocket();
        if (socket) {
            socket.on('attendance_update', () => {
                fetchEmployeesAndAttendance();
                if (viewMode === 'calendar') {
                    fetchCalendarData();
                }
            });
        }

        return () => {
            if (socket) socket.off('attendance_update');
        };
    }, [date, viewMode, selectedEmployee, calendarDate]);

    // Firestore logic remains...
    useEffect(() => {
        let unsubscribe = null;
        try {
            if (db && !user?.isGuest && viewMode === 'daily') {
                const dateStr = format(date, 'yyyy-MM-dd');
                const q = query(collection(db, 'liveAttendance'), where('date', '==', dateStr));
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const liveMap = {};
                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        liveMap[data.employeeId] = { status: data.status, workingHours: data.workingHours };
                    });
                    setAttendance(prev => ({ ...prev, ...liveMap }));
                });
            }
        } catch (error) { console.warn('Firestore error:', error.message); }
        return () => unsubscribe && unsubscribe();
    }, [date, user, viewMode]);

    const fetchEmployeesAndAttendance = async () => {
        if (viewMode !== 'daily') return;
        setLoading(true);
        try {
            const [empRes, attRes] = await Promise.all([
                api.get('/employees'),
                api.get(`/attendance?date=${format(date, 'yyyy-MM-dd')}`)
            ]);
            setEmployees(empRes.data);
            const attMap = {};
            attRes.data.forEach(record => {
                const empId = typeof record.employee === 'object' ? record.employee._id : record.employee;
                attMap[empId] = { status: record.status, workingHours: record.workingHours };
            });
            setAttendance(attMap);
        } catch (error) { toast.error('Sync failed'); }
        finally { setLoading(false); }
    };

    const fetchCalendarData = async () => {
        if (!selectedEmployee && user?.role === 'employee') {
            setSelectedEmployee(employees.find(e => e._id === user._id) || { _id: user._id, name: user.name });
        }
        if (!selectedEmployee) return;

        setLoading(true);
        try {
            const start = format(startOfMonth(calendarDate), 'yyyy-MM-dd');
            const end = format(endOfMonth(calendarDate), 'yyyy-MM-dd');

            const [historyRes, tasksRes] = await Promise.all([
                api.get(`/attendance/employee/${selectedEmployee._id || selectedEmployee}?start=${start}&end=${end}`),
                api.get('/tasks') // We filter tasks in frontend for simplicity
            ]);

            setHistory(historyRes.data);
            setTasks(tasksRes.data.filter(t =>
                (t.assignedTo._id === (selectedEmployee._id || selectedEmployee)) &&
                isSameMonth(new Date(t.dueDate || t.createdAt), calendarDate)
            ));
        } catch (error) { toast.error('History failed to load'); }
        finally { setLoading(false); }
    };

    const markStatus = (employeeId, status) => {
        setAttendance(prev => ({
            ...prev,
            [employeeId]: { ...prev[employeeId], status, workingHours: status === 'Present' ? (prev[employeeId]?.workingHours || 8) : 0 }
        }));
    };

    const updateHours = (employeeId, hours) => {
        setAttendance(prev => ({
            ...prev,
            [employeeId]: { ...prev[employeeId], workingHours: parseFloat(hours) || 0 }
        }));
    };

    const handleSave = async (employeeId) => {
        const record = attendance[employeeId];
        if (!record?.status) return toast.warning('Status required');
        try {
            await api.post('/attendance', {
                employeeId,
                status: record.status,
                workingHours: record.workingHours,
                date: format(date, 'yyyy-MM-dd')
            });
            toast.success('Record Saved');
        } catch (error) { toast.error('Save failed'); }
    };

    const handleBulkSave = async () => {
        setLoading(true);
        try {
            await Promise.all(Object.entries(attendance).map(([employeeId, record]) =>
                api.post('/attendance', {
                    employeeId,
                    status: record.status,
                    workingHours: record.workingHours,
                    date: format(date, 'yyyy-MM-dd')
                })
            ));
            toast.success('Fleet status updated');
        } catch (error) { toast.error('Bulk update failed'); }
        finally { setLoading(false); }
    };

    const statusColors = {
        'Present': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
        'Absent': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30',
        'Sick Leave': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
        'Paid Leave': 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
        'Unpaid Leave': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    };

    const renderCalendar = () => {
        const start = startOfWeek(startOfMonth(calendarDate));
        const end = endOfWeek(endOfMonth(calendarDate));
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="card overflow-hidden animate-in fade-in duration-500">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="py-4 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((day, i) => {
                        const dayOff = !isSameMonth(day, calendarDate);
                        const record = history.find(r => isSameDay(new Date(r.date), day));
                        const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueDate || t.createdAt), day));
                        const allDone = dayTasks.length > 0 && dayTasks.every(t => t.status === 'completed');

                        return (
                            <div key={i} className={cn(
                                "min-h-[80px] md:min-h-[120px] p-2 border-b border-r border-gray-50 dark:border-gray-800 flex flex-col gap-1 transition-colors relative group",
                                dayOff ? "opacity-20" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/20",
                                isToday(day) && "bg-primary-50/30 dark:bg-primary-900/10"
                            )}>
                                <span className={cn(
                                    "text-xs font-black",
                                    isToday(day) ? "text-primary-600" : "text-gray-400"
                                )}>{format(day, 'd')}</span>

                                {record && (
                                    <div className={cn(
                                        "truncate px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-tight shadow-sm",
                                        record.status === 'Present' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                    )}>
                                        {record.status}
                                    </div>
                                )}

                                {dayTasks.length > 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 mt-auto p-1 rounded-md border",
                                        allDone ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                                    )}>
                                        {allDone ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        <span className="text-[7px] md:text-[8px] font-black uppercase">{dayTasks.length} Work {allDone ? 'Done' : 'Pending'}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 px-2 sm:px-0">
            {/* Header with View Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Fleet Attendance</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-lg">Track presence and daily work status.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            viewMode === 'daily' ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm" : "text-gray-400"
                        )}
                    >
                        <List className="w-4 h-4" /> Daily
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            viewMode === 'calendar' ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm" : "text-gray-400"
                        )}
                    >
                        <LayoutGrid className="w-4 h-4" /> Calendar
                    </button>
                </div>
            </div>

            {viewMode === 'daily' ? (
                <div className="space-y-6">
                    {/* Date Navigation */}
                    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 flex-1 md:flex-none justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl">
                            <button onClick={() => setDate(subMonths(date, 0).setDate(date.getDate() - 1) && new Date(date.setDate(date.getDate() - 1)))} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm">
                                <ChevronLeft className="w-5 h-5 dark:text-white" />
                            </button>
                            <span className="font-black text-sm uppercase tracking-widest px-4 truncate dark:text-white">{format(date, 'PPP')}</span>
                            <button onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))} className="p-3 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm">
                                <ChevronRight className="w-5 h-5 dark:text-white" />
                            </button>
                        </div>

                        <div className="flex gap-2 flex-1 md:flex-none">
                            {isEditingAllowed && (
                                <button onClick={() => {
                                    const next = { ...attendance };
                                    employees.forEach(e => { if (!next[e._id]) next[e._id] = { status: 'Present', workingHours: 8 }; });
                                    setAttendance(next);
                                }} className="btn bg-emerald-500 text-white flex-1 md:flex-none border-none shadow-emerald-500/20">
                                    <Check className="w-5 h-5" /> All Present
                                </button>
                            )}
                            <button className="btn bg-gray-100 dark:bg-gray-800 text-gray-500 flex-1 md:flex-none border-none">
                                <FileDown className="w-5 h-5" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="hidden md:block card overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Personnel</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Hours</th>
                                    <th className="px-8 py-5 text-right">Commit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {employees.map(emp => {
                                    const record = attendance[emp._id] || {};
                                    return (
                                        <tr key={emp._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-400 text-xl border-2 border-white dark:border-gray-800">
                                                        {emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black dark:text-white uppercase tracking-tight">{emp.name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{emp.position}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {Object.keys(statusColors).map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => isEditingAllowed && markStatus(emp._id, s)}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                                                record.status === s ? statusColors[s] : "bg-transparent text-gray-400 border-gray-100 dark:border-gray-800"
                                                            )}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <input
                                                    type="number"
                                                    className="w-20 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 font-black text-sm"
                                                    value={record.workingHours || 0}
                                                    onChange={(e) => isEditingAllowed && updateHours(emp._id, e.target.value)}
                                                />
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button onClick={() => handleSave(emp._id)} className="p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:scale-110 transition-transform">
                                                    <Save className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {employees.map(emp => {
                            const record = attendance[emp._id] || {};
                            return (
                                <div key={emp._id} className="card p-6 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-400 text-2xl border-2 border-white dark:border-gray-800">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-lg dark:text-white uppercase tracking-tight">{emp.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{emp.position}</p>
                                        </div>
                                        <button onClick={() => handleSave(emp._id)} className="p-4 bg-primary-600 text-white rounded-2xl shadow-xl shadow-primary-500/20">
                                            <Save className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(statusColors).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => isEditingAllowed && markStatus(emp._id, s)}
                                                    className={cn(
                                                        "flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                                        record.status === s ? statusColors[s] : "bg-transparent text-gray-400 border-gray-100 dark:border-gray-800"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duty Hours</span>
                                            <input
                                                type="number"
                                                className="w-20 bg-white dark:bg-gray-700 border-none rounded-xl px-4 py-2 text-right font-black"
                                                value={record.workingHours || 0}
                                                onChange={(e) => isEditingAllowed && updateHours(emp._id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isEditingAllowed && (
                        <div className="fixed bottom-8 right-4 left-4 md:static z-30">
                            <button onClick={handleBulkSave} className="w-full h-16 bg-primary-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center justify-center gap-4 hover:bg-primary-700 transition-all">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                Commit Fleet State
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    {/* Calendar Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end px-2">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                                <Target className="w-6 h-6 text-primary-500" /> Selective Intelligence
                            </h3>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-1.5 shadow-sm">
                                <select
                                    className="w-full bg-transparent border-none font-black uppercase text-[11px] tracking-widest py-3 px-4 dark:text-white outline-none"
                                    value={selectedEmployee?._id || ''}
                                    onChange={(e) => {
                                        const emp = employees.find(emp => emp._id === e.target.value);
                                        setSelectedEmployee(emp);
                                    }}
                                >
                                    <option value="">Select Unit / Force Member</option>
                                    {employees.map(e => <option key={e._id} value={e._id} className="dark:bg-gray-900">{e.name} - {e.employeeId}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <button onClick={() => setCalendarDate(subMonths(calendarDate, 1))} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                                <ChevronLeft className="w-5 h-5 dark:text-white" />
                            </button>
                            <span className="font-black text-xs uppercase tracking-[0.2em] px-4 dark:text-white">{format(calendarDate, 'MMMM yyyy')}</span>
                            <button onClick={() => setCalendarDate(addMonths(calendarDate, 1))} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                                <ChevronRight className="w-5 h-5 dark:text-white" />
                            </button>
                        </div>
                    </div>

                    {selectedEmployee ? (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-primary-500 p-6 rounded-3xl text-white shadow-xl shadow-primary-500/20">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-black text-2xl border border-white/10">
                                    {selectedEmployee.name.charAt(0)}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{selectedEmployee.name}</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Unit: {selectedEmployee.employeeId} • {selectedEmployee.position}</p>
                                </div>
                                <div className="sm:ml-auto grid grid-cols-2 gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{history.filter(h => h.status === 'Present').length}</p>
                                        <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Days Present</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black">{tasks.filter(t => t.status === 'completed').length}</p>
                                        <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Tasks Done</p>
                                    </div>
                                </div>
                            </div>

                            {renderCalendar()}
                        </div>
                    ) : (
                        <div className="card p-20 text-center space-y-6 bg-gray-50 dark:bg-gray-800/30 border-dashed border-2">
                            <CalendarIcon className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto" />
                            <p className="text-gray-400 font-black uppercase tracking-[0.3em]">Select a Force Member to View Trajectory</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Attendance;
