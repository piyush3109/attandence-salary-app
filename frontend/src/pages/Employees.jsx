import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    UserPlus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Employees = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        position: '',
        address: '',
        salaryRate: '',
        rateType: 'per_day',
        profilePhoto: '',
        role: 'employee',
        guarantorName: '',
        guarantorPhone: '',
        guarantorRelation: ''
    });

    const isAuthority = ['admin', 'ceo', 'manager'].includes(user?.role);
    const isHigherAuthority = ['admin', 'ceo'].includes(user?.role);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get(`/employees?search=${searchTerm}`);
            setEmployees(data);
        } catch (error) {
            toast.error('Failed to fetch employees');
        }
    };

    useEffect(() => {
        fetchEmployees();

        const socket = getSocket();
        if (socket) {
            socket.on('employee_joined', () => {
                fetchEmployees();
            });
        }

        return () => {
            if (socket) socket.off('employee_joined');
        };
    }, [searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            guarantor: {
                name: formData.guarantorName,
                phone: formData.guarantorPhone,
                relation: formData.guarantorRelation
            }
        };
        try {
            if (editingId) {
                await api.put(`/employees/${editingId}`, payload);
                toast.success('Employee updated');
            } else {
                await api.post('/employees', payload);
                toast.success('Employee added');
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({
                employeeId: '', name: '', email: '', phone: '', password: '',
                position: '', address: '', salaryRate: '', rateType: 'per_day',
                role: 'employee',
                profilePhoto: '', guarantorName: '', guarantorPhone: '', guarantorRelation: ''
            });
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (emp) => {
        setEditingId(emp._id);
        setFormData({
            employeeId: emp.employeeId || '',
            name: emp.name,
            email: emp.email || '',
            phone: emp.phone,
            password: '', // Don't show password for editing
            position: emp.position,
            address: emp.address || '',
            salaryRate: emp.salaryRate,
            rateType: emp.rateType,
            role: emp.role || 'employee',
            profilePhoto: emp.profilePhoto || '',
            guarantorName: emp.guarantor?.name || '',
            guarantorPhone: emp.guarantor?.phone || '',
            guarantorRelation: emp.guarantor?.relation || ''
        });
        setShowModal(true);
    };

    const deleteEmployee = async (id) => {
        if (!window.confirm('Remove this personnel from active fleet?')) return;
        try {
            await api.delete(`/employees/${id}`);
            toast.success('Personnel removed');
            fetchEmployees();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Personnel Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage transport workforce, permission levels, and logistics rates.</p>
                </div>
                {isAuthority && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                                name: '', email: '', phone: '', password: '',
                                position: '', address: '', salaryRate: '', rateType: 'per_day',
                                role: 'employee',
                                profilePhoto: '', guarantorName: '', guarantorPhone: '', guarantorRelation: ''
                            });
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add New Personnel
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden lg:block card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, position, ID..."
                                className="input pl-12 h-12"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 text-[10px] uppercase font-black tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">S.No & ID</th>
                                    <th className="px-8 py-5">Employee Info</th>
                                    <th className="px-8 py-5">Position</th>
                                    <th className="px-8 py-5">Permission</th>
                                    <th className="px-8 py-5">Phone</th>
                                    <th className="px-8 py-5">Salary Rate</th>
                                    {isAuthority && <th className="px-8 py-5 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {employees.map((emp, index) => (
                                    <tr key={emp._id} className="group hover:bg-primary-50/30 dark:hover:bg-primary-900/5 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400">{String(index + 1).padStart(2, '0')}</span>
                                                <span className="font-bold text-primary-600 dark:text-primary-400">{emp.employeeId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden shadow-sm group-hover:scale-105 transition-all duration-300">
                                                    {emp.profilePhoto ? (
                                                        <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 dark:text-gray-100 uppercase">{emp.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{emp.email || 'No Email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium">{emp.position}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                emp.role === 'ceo' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                                    emp.role === 'manager' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                                                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            )}>
                                                {emp.role || 'Personnel'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 dark:text-gray-400 font-medium">{emp.phone}</td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-bold border border-emerald-100/50 dark:border-emerald-900/20">
                                                ₹{emp.salaryRate.toLocaleString()}<span className="opacity-50 text-[10px]">/{emp.rateType === 'per_day' ? 'DAY' : 'HR'}</span>
                                            </div>
                                        </td>
                                        {isAuthority && (
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEdit(emp)} className="w-9 h-9 flex items-center justify-center text-blue-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all shadow-sm">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {isHigherAuthority && (
                                                        <button onClick={() => deleteEmployee(emp._id)} className="w-9 h-9 flex items-center justify-center text-rose-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-6">
                    <div className="px-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                className="input pl-12 h-14"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                        {employees.map((emp) => (
                            <div key={emp._id} className="card p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                            {emp.profilePhoto ? (
                                                <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-xl capitalize">
                                                    {emp.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 dark:text-white text-lg uppercase leading-tight">{emp.name}</div>
                                            <div className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-0.5">{emp.employeeId}</div>
                                        </div>
                                    </div>
                                    {isAuthority && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(emp)} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {isHigherAuthority && (
                                                <button onClick={() => deleteEmployee(emp._id)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-gray-800">
                                    <div>
                                        <div className="label">Position</div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{emp.position}</div>
                                    </div>
                                    <div>
                                        <div className="label">Permission</div>
                                        <div className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                            emp.role === 'ceo' ? "bg-amber-100 text-amber-700" :
                                                emp.role === 'manager' ? "bg-blue-100 text-blue-700" :
                                                    "bg-gray-100 text-gray-600"
                                        )}>
                                            {emp.role || 'Personnel'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="label">Phone</div>
                                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{emp.phone}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="label">Rate</div>
                                        <div className="text-emerald-600 font-black">₹{emp.salaryRate.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)} />
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black dark:text-white tracking-tight">{editingId ? 'Edit Profile' : 'New Employee'}</h3>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] border-b border-primary-500/10 pb-2">Basic Information</h4>
                                        <div className="space-y-2">
                                            <label className="label">Employee ID</label>
                                            <input required className="input" placeholder="EMP001" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label">Full Name</label>
                                            <input required className="input" placeholder="e.g. Rahul Kumar" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label">Login Password</label>
                                            <input required={!editingId} type="password" className="input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="label">Contact No.</label>
                                                <input required className="input" placeholder="98123xxxxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="label">Email (Optional)</label>
                                                <input type="email" className="input" placeholder="rahul@example.in" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label">Position</label>
                                            <input required className="input" placeholder="e.g. Driver, Helper" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] border-b border-orange-500/10 pb-2">Verification & Salary</h4>
                                        <div className="space-y-2">
                                            <label className="label">Permanent Address</label>
                                            <input required className="input" placeholder="House No, Street, City, State" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="label">Salary Rate (₹)</label>
                                                <input type="number" required className="input" placeholder="0" value={formData.salaryRate} onChange={(e) => setFormData({ ...formData, salaryRate: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="label">Period</label>
                                                <select className="input appearance-none" value={formData.rateType} onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}>
                                                    <option value="per_day">Per Day</option>
                                                    <option value="per_hour">Per Hour</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="label">Permission Level</label>
                                                <select className="input appearance-none" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                                    <option value="employee">Employee</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="ceo">CEO</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="label">Profile Photo (URL)</label>
                                                <input className="input" placeholder="https://..." value={formData.profilePhoto} onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] border-b border-emerald-500/10 pb-2">Security & Guarantor</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="label">Guarantor Name</label>
                                                <input className="input" placeholder="Name" value={formData.guarantorName} onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="label">Relation</label>
                                                <input className="input" placeholder="Father/Friend" value={formData.guarantorRelation} onChange={(e) => setFormData({ ...formData, guarantorRelation: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="label">Guarantor Phone</label>
                                            <input className="input" placeholder="Contact No." value={formData.guarantorPhone} onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 h-14 rounded-2xl">
                                    Discard
                                </button>
                                <button type="submit" className="btn btn-primary flex-1 h-14 rounded-2xl">
                                    {editingId ? 'Save Profile' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
