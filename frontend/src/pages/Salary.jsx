import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    FileDown,
    FileText,
    Search,
    Calendar,
    IndianRupee,
    MinusCircle,
    Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

const Salary = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRate, setEditingRate] = useState(null); // { id, name, rate, type }
    const [editingAdjustment, setEditingAdjustment] = useState(null); // { id, name, bonus, fine }
    const [newRate, setNewRate] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/salary/report?month=${month}&year=${year}`);
            setReport(data);
        } catch (error) {
            toast.error('Failed to load salary report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const handleExport = async (format) => {
        try {
            const response = await api.get(`/salary/report?month=${month}&year=${year}&format=${format}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Salary_Report_${month}_${year}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleUpdateRate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/employees/${editingRate.id}`, { salaryRate: Number(newRate) });
            toast.success('Salary rate updated');
            setEditingRate(null);
            fetchReport();
        } catch (error) {
            toast.error('Failed to update rate');
        }
    };

    const handleDownloadSlip = async (employeeId, employeeName) => {
        try {
            const extraQuery = editingAdjustment ? `&bonus=${editingAdjustment.bonus}&fine=${editingAdjustment.fine}` : '';
            const response = await api.get(`/salary/slip/${employeeId}?month=${month}&year=${year}${extraQuery}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SalarySlip_${employeeName}_${month}_${year}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            if (editingAdjustment) setEditingAdjustment(null);
        } catch (error) {
            toast.error('Failed to download salary slip');
        }
    };

    const handlePrintWithAdjustment = (e) => {
        e.preventDefault();
        handleDownloadSlip(editingAdjustment.id, editingAdjustment.name);
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Salary Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monthly breakdown and payment reports.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => handleExport('pdf')} className="btn btn-secondary !py-2.5">
                        <FileText className="w-5 h-5 text-rose-500" />
                        <span className="hidden sm:inline">PDF Report</span>
                    </button>
                    <button onClick={() => handleExport('csv')} className="btn btn-secondary !py-2.5">
                        <FileDown className="w-5 h-5 text-emerald-500" />
                        <span className="hidden sm:inline">CSV Export</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6 flex flex-col gap-4 group">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl text-primary-600 group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Month</span>
                    </div>
                    <select
                        className="bg-transparent font-black text-2xl dark:text-white outline-none cursor-pointer appearance-none"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i + 1} className="dark:bg-gray-800">{m}</option>
                        ))}
                    </select>
                </div>

                <div className="card p-6 flex flex-col gap-4 group">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Year</span>
                    </div>
                    <select
                        className="bg-transparent font-black text-2xl dark:text-white outline-none cursor-pointer appearance-none"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y} className="dark:bg-gray-800">{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card">
                {/* Desktop view */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Employee</th>
                                <th className="px-8 py-5 text-center">Work Summary</th>
                                <th className="px-8 py-5 text-right">Base Pay</th>
                                <th className="px-8 py-5 text-right">Overtime</th>
                                <th className="px-8 py-5 text-right">Deductions</th>
                                <th className="px-8 py-5 text-right">Net Payable</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {report.length > 0 ? report.map((item) => (
                                <tr key={item._id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-black text-gray-500 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 dark:text-white">{item.name}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.position}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5 items-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-bold">
                                                {item.rateType === 'per_day' ? (
                                                    <><Calendar className="w-3 h-3" /> {item.presentDays} + {item.paidLeaveDays || 0}L Days</>
                                                ) : (
                                                    <><Clock className="w-3 h-3" /> {item.totalHours.toFixed(1)} Hrs</>
                                                )}
                                            </div>
                                            {item.overtimeHours > 0 && (
                                                <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">
                                                    +{item.overtimeHours.toFixed(1)}h Overtime
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-gray-900 dark:text-white">
                                        ₹{item.baseSalary.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        ₹{item.overtimePay.toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex items-center gap-1 text-rose-500 font-bold">
                                            <MinusCircle className="w-3 h-3" />
                                            ₹{item.totalAdvance.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-primary-600 dark:text-primary-400 text-xl font-black">
                                            ₹{item.finalPayable.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right space-x-2">
                                        <button
                                            onClick={() => {
                                                setEditingRate({ id: item._id, name: item.name, rate: item.rate, type: item.rateType });
                                                setNewRate(item.rate);
                                            }}
                                            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all group/btn shadow-sm"
                                            title="Edit Rate"
                                        >
                                            <IndianRupee className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingAdjustment({ id: item._id, name: item.name, bonus: 0, fine: 0 });
                                            }}
                                            className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition-all group/btn shadow-sm"
                                            title="Adjust Payslip (Bonus/Fine)"
                                        >
                                            <MinusCircle className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadSlip(item._id, item.name)}
                                            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white rounded-xl transition-all group/btn shadow-sm"
                                            title="Download Salary Slip"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center text-gray-400 font-medium">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                        No data found for the selected period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view */}
                <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {report.length > 0 ? report.map((item) => (
                        <div key={item._id} className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-black">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-900 dark:text-white">{item.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">{item.position}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadSlip(item._id, item.name)}
                                    className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Pay</div>
                                    <div className="font-bold text-gray-900 dark:text-white">₹{item.baseSalary.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                                    <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Overtime</div>
                                    <div className="font-bold text-emerald-600">₹{item.overtimePay.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
                                    <div className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mb-1">Deductions</div>
                                    <div className="font-bold text-rose-600">₹{item.totalAdvance.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100/50 dark:border-primary-900/20">
                                    <div className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Net Pay</div>
                                    <div className="font-black text-primary-600">₹{item.finalPayable.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="px-8 py-20 text-center text-gray-400 font-medium">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            No data found for the selected period.
                        </div>
                    )}
                </div>
            </div>
            {/* Edit Rate Modal */}
            {editingRate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center space-y-4 mb-8">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <IndianRupee className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Update Pay Rate</h2>
                            <p className="text-gray-500 text-sm">Update salary rate for <span className="font-bold text-gray-900 dark:text-white">{editingRate.name}</span></p>
                        </div>

                        <form onSubmit={handleUpdateRate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">New Rate (₹ per {editingRate.type === 'per_day' ? 'day' : 'hour'})</label>
                                <input
                                    type="number"
                                    required
                                    className="input bg-gray-50 dark:bg-gray-800 text-xl font-black py-4"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" className="btn flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" onClick={() => setEditingRate(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
                                    Update Rate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Adjustment Modal */}
            {editingAdjustment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="text-center space-y-4 mb-8">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MinusCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Adjust Payslip</h2>
                            <p className="text-gray-500 text-sm">Add manual bonus or fine for <span className="font-bold text-gray-900 dark:text-white">{editingAdjustment.name}</span> passing to slip generated.</p>
                        </div>

                        <form onSubmit={handlePrintWithAdjustment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Bonus Addition (₹)</label>
                                <input
                                    type="number"
                                    className="input bg-emerald-50 dark:bg-emerald-900/10 text-xl font-black py-4 border-emerald-500/20"
                                    value={editingAdjustment.bonus}
                                    onChange={(e) => setEditingAdjustment({ ...editingAdjustment, bonus: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">Fine Deduction (₹)</label>
                                <input
                                    type="number"
                                    className="input bg-rose-50 dark:bg-rose-900/10 text-xl font-black py-4 border-rose-500/20"
                                    value={editingAdjustment.fine}
                                    onChange={(e) => setEditingAdjustment({ ...editingAdjustment, fine: e.target.value })}
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" className="btn flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" onClick={() => setEditingAdjustment(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn flex-1 bg-amber-600 text-white hover:bg-amber-700">
                                    Print PDF
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salary;
