import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    PlusCircle,
    Calendar,
    IndianRupee,
    Clock,
    Trash2,
    Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Advance = () => {
    const [employees, setEmployees] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        reason: ''
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const { data } = await api.get('/employees');
                setEmployees(data);
            } catch (error) {
                toast.error('Failed to load employees');
            }
        };
        fetchEmployees();
        fetchAdvances();
    }, []);

    const fetchAdvances = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/advance');
            setAdvances(data);
        } catch (error) {
            toast.error('Failed to load advances');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.amount || !formData.date) {
            return toast.warning('Please fill all required fields');
        }

        try {
            await api.post('/advance', {
                employeeId: formData.employeeId,
                amount: parseFloat(formData.amount),
                date: formData.date,
                reason: formData.reason
            });
            toast.success('Advance recorded successfully');
            setShowModal(false);
            setFormData({
                employeeId: '',
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                reason: ''
            });
            fetchAdvances();
        } catch (error) {
            toast.error('Failed to record advance');
        }
    };

    const deleteAdvance = async (id) => {
        if (window.confirm('Are you sure you want to delete this advance?')) {
            try {
                await api.delete(`/advance/${id}`);
                toast.success('Advance deleted successfully');
                fetchAdvances();
            } catch (error) {
                toast.error('Failed to delete advance');
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Advance Payments</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Record and track employee cash advances.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                >
                    <PlusCircle className="w-5 h-5" />
                    Record New Advance
                </button>
            </div>

            <div className="card">
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Employee</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Description</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : advances.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-gray-400 font-medium italic">
                                        No advances recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                advances.map((adv) => (
                                    <tr key={adv._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-black text-gray-500 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                                    {adv.employee?.name.charAt(0)}
                                                </div>
                                                <div className="font-black text-gray-900 dark:text-white">{adv.employee?.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(adv.date), 'dd MMM yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-black border border-amber-100/50 dark:border-amber-900/20">
                                                ₹{adv.amount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 dark:text-gray-400 max-w-xs truncate italic">
                                            {adv.reason || 'No description provided'}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button onClick={() => deleteAdvance(adv._id)} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm ml-auto group/del">
                                                <Trash2 className="w-4 h-4 group-hover/del:rotate-12 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        </div>
                    ) : advances.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium italic">
                            No advances recorded yet.
                        </div>
                    ) : (
                        advances.map((adv) => (
                            <div key={adv._id} className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center font-black">
                                            {adv.employee?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 dark:text-white">{adv.employee?.name}</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(adv.date), 'dd MMM yyyy')}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAdvance(adv._id)} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</div>
                                    <div className="text-lg font-black text-amber-600">₹{adv.amount.toLocaleString()}</div>
                                </div>
                                {adv.reason && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        "{adv.reason}"
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)} />
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md p-10 relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                        <h3 className="text-2xl font-black mb-6 dark:text-white">Record Advance</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Employee</label>
                                <select
                                    required
                                    className="input h-14"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                >
                                    <option value="">Choose an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Amount</label>
                                <div className="relative h-14">
                                    <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        className="input pl-12 h-full font-bold text-lg"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="input h-14"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason (Optional)</label>
                                <textarea
                                    className="input min-h-[100px] py-4"
                                    placeholder="Enter reason for advance..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    Save Advance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Advance;
