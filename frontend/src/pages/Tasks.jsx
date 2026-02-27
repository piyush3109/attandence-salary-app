import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import {
    Briefcase,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Tasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'medium',
        dueDate: ''
    });

    const isAdmin = ['admin', 'ceo', 'manager'].includes(user?.role);

    useEffect(() => {
        fetchTasks();
        if (isAdmin) fetchEmployees();

        const socket = getSocket();
        if (socket) {
            socket.on('task_update', () => {
                fetchTasks();
            });
        }

        return () => {
            if (socket) socket.off('task_update');
        };
    }, [user]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tasks');
            setTasks(data);
        } catch (error) {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/employees');
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', formData);
            toast.success('Work assigned successfully');
            setShowModal(false);
            setFormData({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign work');
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
            toast.success(`Task marked as ${newStatus}`);
            fetchTasks();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Are you sure you want to remove this task?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            toast.success('Task removed');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleStartTimer = async (taskId) => {
        try {
            await api.put(`/tasks/${taskId}/start-timer`);
            toast.success('Timer started');
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start timer');
        }
    };

    const handleStopTimer = async (taskId) => {
        try {
            await api.put(`/tasks/${taskId}/stop-timer`);
            toast.success('Timer stopped');
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to stop timer');
        }
    };

    const priorityColors = {
        low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        medium: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        high: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        urgent: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Work Hub</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Assign and track operational tasks for the fleet.</p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary h-14 px-8 shadow-xl shadow-primary-500/20 flex items-center gap-3"
                    >
                        <Plus className="w-5 h-5" />
                        Assign New Work
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : tasks.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {tasks.map((task) => (
                        <div key={task._id} className="card p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-300">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", priorityColors[task.priority])}>
                                                {task.priority}
                                            </span>
                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider", statusColors[task.status])}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors uppercase mt-2">
                                            {task.title}
                                        </h3>
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(task._id)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {task.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-white dark:border-gray-700">
                                        {task.assignedTo?.profilePhoto ? (
                                            <img src={task.assignedTo.profilePhoto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-gray-400">
                                                {task.assignedTo?.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{task.assignedTo?.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{task.assignedTo?.position}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {task.dueDate && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{format(new Date(task.dueDate), 'MMM dd')}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-xl">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{task.timeLogged || 0}m logged</span>
                                    </div>

                                    {!isAdmin && task.status !== 'completed' && (
                                        <>
                                            {task.timeEntries?.some(e => !e.endTime) ? (
                                                <button
                                                    onClick={() => handleStopTimer(task._id)}
                                                    className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Stop Timer
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartTimer(task._id)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Start Timer
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleUpdateStatus(task._id, task.status === 'pending' ? 'in-progress' : 'completed')}
                                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                                {task.status === 'pending' ? 'Start Task' : 'Complete'}
                                            </button>
                                        </>
                                    )}

                                    {isAdmin && task.status !== 'completed' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateStatus(task._id, 'completed')}
                                                className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                                title="Mark as Completed"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card p-20 text-center space-y-6 bg-gray-50/50 dark:bg-gray-800/10">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <Briefcase className="w-10 h-10" />
                    </div>
                    <div className="max-w-xs mx-auto">
                        <h3 className="text-xl font-black dark:text-white">No active tasks</h3>
                        <p className="text-gray-500 mt-2">All units are currently clear. {isAdmin ? 'Assign new work to get started.' : 'Relax for a while.'}</p>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="card w-full max-w-lg p-8 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Assign Work</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Work Title</label>
                                <input
                                    required
                                    className="input text-lg font-black"
                                    placeholder="e.g. Route 42 Logistics Setup"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Description</label>
                                <textarea
                                    className="input min-h-[100px] py-4"
                                    placeholder="Detail the work requirements..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign To</label>
                                    <select
                                        required
                                        className="input"
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    >
                                        <option value="">Select Personnel</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity/Priority</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['low', 'medium', 'high', 'urgent'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            className={cn(
                                                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                formData.priority === p
                                                    ? "bg-primary-600 border-primary-600 text-white"
                                                    : "bg-gray-50 border-gray-100 text-gray-400 dark:bg-gray-800 dark:border-gray-700"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full h-16 text-lg">
                                Deploy Assignment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Re-using Lucide X icon which was not imported in initial list
const X = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
);

export default Tasks;
