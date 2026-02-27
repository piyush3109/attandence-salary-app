import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    IndianRupee,
    Calendar,
    Download,
    TrendingUp,
    TrendingDown,
    Clock,
    CalendarCheck,
    Briefcase,
    FileText,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { toast } from 'react-toastify';

const MySalary = () => {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date());
    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchSalaryHistory = async () => {
        setLoading(true);
        try {
            const month = format(date, 'M');
            const year = format(date, 'yyyy');
            const { data } = await api.get(`/salary/history?month=${month}&year=${year}`);
            setSalaryData(data);
        } catch (error) {
            toast.error('Failed to load salary details');
            setSalaryData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalaryHistory();
    }, [date]);

    const handleDownloadSlip = async () => {
        try {
            const month = format(date, 'M');
            const year = format(date, 'yyyy');
            const response = await api.get(`/salary/slip/${user._id}?month=${month}&year=${year}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SalarySlip_${format(date, 'MMM_yyyy')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download salary slip');
        }
    };

    const changeDate = (offset) => {
        setDate(prev => offset > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Financial Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Review your monthly earnings and deductions.</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 dark:text-white" />
                    </button>
                    <div className="flex items-center gap-3 px-4 font-black text-gray-900 dark:text-white min-w-[160px] justify-center">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <span>{format(date, 'MMMM yyyy')}</span>
                    </div>
                    <button onClick={() => changeDate(1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 dark:text-white" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            ) : salaryData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Net Pay Card */}
                        <div className="card p-10 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div>
                                    <p className="text-emerald-100 font-bold uppercase text-[10px] tracking-widest mb-2">Net Payable Amount</p>
                                    <h2 className="text-6xl font-black tracking-tight">₹{salaryData.finalPayable?.toLocaleString()}</h2>
                                    <div className="flex items-center gap-2 mt-4 text-emerald-100/80 font-bold text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>Estimated for {format(date, 'MMMM')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownloadSlip}
                                    className="btn bg-white text-emerald-700 hover:bg-emerald-50 border-none h-16 px-8 rounded-2xl shadow-xl flex items-center gap-3 font-black transition-all active:scale-95"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Slip
                                </button>
                            </div>
                        </div>

                        {/* Earnings Breakdown */}
                        <div className="card p-8">
                            <h3 className="text-xl font-black mb-8 dark:text-white flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Earnings Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Salary</p>
                                            <p className="text-lg font-black dark:text-white">₹{salaryData.baseSalary?.toLocaleString()}</p>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-500 mb-1">REGULAR</span>
                                    </div>
                                    <div className="flex justify-between items-end pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overtime Pay</p>
                                            <p className="text-lg font-black dark:text-white">₹{salaryData.overtimePay?.toLocaleString()}</p>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md mb-1">EXTRA</span>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 flex flex-col justify-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Work Performance</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-gray-500">Present Days</span>
                                                <span className="dark:text-white">{salaryData.presentDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-gray-500">Paid Leaves</span>
                                                <span className="dark:text-white">{salaryData.paidLeaveDays}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                                                <span className="text-gray-500">Total Hours</span>
                                                <span className="dark:text-white">{salaryData.totalHours}h</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Deductions Card */}
                        <div className="card p-8 border-none bg-rose-50 dark:bg-rose-900/10">
                            <h3 className="text-xl font-black mb-6 text-rose-600 flex items-center gap-3">
                                <TrendingDown className="w-5 h-5" />
                                Deductions
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                                            <IndianRupee className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Total Advances</span>
                                    </div>
                                    <span className="text-lg font-black text-rose-600">- ₹{salaryData.totalAdvance?.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 px-2 italic">
                                    * Advance amounts are automatically deducted from the final payable amount.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="card p-6 text-center space-y-2">
                                <Clock className="w-6 h-6 text-primary-500 mx-auto" />
                                <p className="text-xl font-black dark:text-white">{salaryData.overtimeHours}h</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OT Hours</p>
                            </div>
                            <div className="card p-6 text-center space-y-2">
                                <CalendarCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                                <p className="text-xl font-black dark:text-white">{salaryData.presentDays + salaryData.paidLeaveDays}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay Days</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card p-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black dark:text-white">No Record Found</h3>
                        <p className="text-gray-500">We couldn't find any salary data for {format(date, 'MMMM yyyy')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySalary;
