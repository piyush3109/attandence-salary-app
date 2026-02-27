import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    Calendar,
    CalendarCheck,
    Clock,
    XCircle,
    CheckCircle,
    Plus,
    FileText,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import clsx from 'clsx';

const LeaveStatusBadge = ({ status }) => {
    switch (status) {
        case 'Approved':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                </span>
            );
        case 'Rejected':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg">
                    <XCircle className="w-3.5 h-3.5" /> Rejected
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg">
                    <Clock className="w-3.5 h-3.5" /> Pending
                </span>
            );
    }
};

const Leaves = () => {
    const { user, isEmployee } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Application state
    const [leaveType, setLeaveType] = useState('Sick Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // Admin state
    const [updateStatus, setUpdateStatus] = useState({ id: null, status: '', comments: '' });

    const fetchLeaves = async () => {
        try {
            const endpoint = isEmployee ? '/leaves/my' : '/leaves';
            // Disable cache for fresh updates
            const { data } = await api.get(endpoint, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            setLeaves(data);
        } catch (error) {
            toast.error('Failed to load leaves');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [isEmployee]);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leaves', {
                type: leaveType,
                startDate,
                endDate,
                reason
            });
            toast.success('Leave applied successfully');
            setShowModal(false);
            setLeaveType('Sick Leave');
            setStartDate('');
            setEndDate('');
            setReason('');
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to apply for leave');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/leaves/${updateStatus.id}/status`, {
                status: updateStatus.status,
                comments: updateStatus.comments
            });
            toast.success('Leave status updated');
            setUpdateStatus({ id: null, status: '', comments: '' });
            fetchLeaves();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Leave Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {isEmployee ? 'Track and apply for leaves' : 'Manage employee leave requests'}
                    </p>
                </div>

                {isEmployee && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn bg-primary-600 hover:bg-primary-700 text-white border-none h-12 px-6 rounded-xl shadow-lg shadow-primary-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Apply Leave
                    </button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 flex flex-col justify-center items-center text-center gap-2">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{leaves.filter(l => l.status === 'Pending').length}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Pending Requests</p>
                    </div>
                </div>
                <div className="card p-6 flex flex-col justify-center items-center text-center gap-2">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{leaves.filter(l => l.status === 'Approved').length}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Approved</p>
                    </div>
                </div>
                <div className="card p-6 flex flex-col justify-center items-center text-center gap-2">
                    <div className="w-12 h-12 bg-rose-50 text-rose-500 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 dark:text-white">{leaves.filter(l => l.status === 'Rejected').length}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Rejected</p>
                    </div>
                </div>
            </div>

            {/* Leave List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                            <CalendarCheck className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Leaves Found</h3>
                        <p className="text-sm text-gray-500">There are no leave requests to display</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                    {!isEmployee && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Employee</th>}
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Duration</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Reason</th>
                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
                                    {!isEmployee && <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave._id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                        {!isEmployee && (
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{leave.employee?.name}</div>
                                                <div className="text-xs text-gray-500">{leave.employee?.email}</div>
                                            </td>
                                        )}
                                        <td className="p-4">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{leave.type}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                            {format(new Date(leave.startDate), 'MMM dd, yyyy')} - <br />
                                            {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {leave.reason}
                                            {leave.comments && (
                                                <div className="text-xs text-primary-500 mt-1 flex gap-1 items-center">
                                                    <FileText className="w-3 h-3" />
                                                    Admin: {leave.comments}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <LeaveStatusBadge status={leave.status} />
                                        </td>
                                        {!isEmployee && (
                                            <td className="p-4">
                                                {leave.status === 'Pending' && (
                                                    <button
                                                        onClick={() => setUpdateStatus({ id: leave._id, status: 'Approved', comments: '' })}
                                                        className="text-primary-600 hover:text-primary-700 font-bold text-sm"
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Apply Leave Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Apply for Leave</h2>
                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Leave Type</label>
                                <select
                                    className="input focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800"
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                >
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Paid Leave">Paid Leave</option>
                                    <option value="Unpaid Leave">Unpaid Leave</option>
                                    <option value="Maternity/Paternity">Maternity/Paternity</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="input focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Reason</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Explain your reason for leave..."
                                    className="input focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 resize-none"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" className="btn flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-none" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn flex-1 bg-primary-600 text-white hover:bg-primary-700 border-none shadow-lg shadow-primary-500/20">
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Review Modal */}
            {updateStatus.id && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Review Leave</h2>
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Action</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setUpdateStatus(prev => ({ ...prev, status: 'Approved' }))}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all",
                                            updateStatus.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <CheckCircle className="w-5 h-5" /> Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUpdateStatus(prev => ({ ...prev, status: 'Rejected' }))}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-center gap-2 font-black transition-all",
                                            updateStatus.status === 'Rejected' ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        <XCircle className="w-5 h-5" /> Reject
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Comments (Optional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add notes for the employee..."
                                    className="input focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 resize-none"
                                    value={updateStatus.comments}
                                    onChange={(e) => setUpdateStatus(prev => ({ ...prev, comments: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" className="btn flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 border-none" onClick={() => setUpdateStatus({ id: null, status: '', comments: '' })}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn flex-1 bg-primary-600 text-white hover:bg-primary-700 border-none shadow-lg shadow-primary-500/20">
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaves;
