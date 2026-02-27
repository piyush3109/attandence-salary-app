import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    GraduationCap,
    MapPin,
    Shield,
    UserPlus,
    LogOut,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Search,
    ChevronRight,
    Award
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Ops = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('lifecycle');
    const [employees, setEmployees] = useState([]);
    const [trainings, setTrainings] = useState([]);
    const [visits, setVisits] = useState([]);
    const [probationAlerts, setProbationAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = ['admin', 'ceo', 'manager'].includes(user?.role);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'lifecycle') {
                const { data } = await api.get('/employees');
                setEmployees(data);
                if (isAdmin) {
                    const alertData = await api.get('/lifecycle/probation-alerts');
                    setProbationAlerts(alertData.data);
                }
            } else if (activeTab === 'training') {
                const { data } = await api.get('/trainings');
                setTrainings(data);
            } else if (activeTab === 'field') {
                const { data } = await api.get('/field/visits');
                setVisits(data);
            }
        } catch (error) {
            toast.error('Failed to sync operation data');
        } finally {
            setLoading(false);
        }
    };

    const handleExit = async (empId) => {
        if (!window.confirm('Initiate offboarding for this employee?')) return;
        try {
            await api.post(`/lifecycle/${empId}/exit`, { exitReason: 'Resigned' });
            toast.success('Exit process initiated');
            fetchData();
        } catch (error) {
            toast.error('Failed to initiate exit');
        }
    };

    const downloadExperienceLetter = async (empId) => {
        try {
            window.open(`${import.meta.env.VITE_API_BASE}/api/lifecycle/${empId}/experience-letter`, '_blank');
        } catch (error) {
            toast.error('Could not generate letter');
        }
    };

    const tabs = [
        { id: 'lifecycle', name: 'Lifecycle', icon: LogOut },
        { id: 'training', name: 'Training', icon: GraduationCap },
        { id: 'field', name: 'Field Visits', icon: MapPin },
        { id: 'compliance', name: 'Compliance', icon: Shield },
    ];

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-0 px-2 sm:px-0">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="px-2">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Strategic Ops</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-lg">Unified Command for Force & Compliance.</p>
                </div>

                {/* Mobile Scrollable Tabs */}
                <div className="flex overflow-x-auto no-scrollbar bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex gap-1 min-w-full">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 justify-center",
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-gray-700 text-primary-600 shadow-sm border border-gray-100 dark:border-gray-600"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                )}
                            >
                                <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600/20 border-t-primary-600"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Intelligence...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:gap-10">
                    {/* Lifecycle Tab */}
                    {activeTab === 'lifecycle' && (
                        <div className="space-y-6">
                            {isAdmin && probationAlerts.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex items-center gap-5 animate-pulse">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Critical: Probation Review</p>
                                        <p className="text-sm font-bold text-amber-900/80 dark:text-amber-400/80">{probationAlerts.length} Units completing probation - Review Required.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                                    <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                                        <Activity className="w-6 h-6 text-primary-500" />
                                        Unit Pipeline
                                    </h3>
                                    <div className="relative group flex-1 md:max-w-xs">
                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            className="input py-3 pl-12 text-sm w-full bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-2xl"
                                            placeholder="Search callsign..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Mobile Cards View (Responsive) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                                    {filteredEmployees.map((emp) => (
                                        <div key={emp._id} className="card p-5 group hover:border-primary-500/40 transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-12 -mt-12"></div>

                                            <div className="flex items-start justify-between relative z-10 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-primary-600 text-xl shadow-inner border border-white dark:border-gray-700">
                                                        {emp.profilePhoto ? (
                                                            <img src={emp.profilePhoto} className="w-full h-full object-cover rounded-2xl" />
                                                        ) : emp.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black dark:text-white uppercase tracking-tight">{emp.name}</p>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{emp.position}</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                                                    emp.status === 'Active' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" :
                                                        emp.status === 'Probation' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" : "bg-gray-50 text-gray-500 dark:bg-gray-500/10"
                                                )}>
                                                    {emp.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100 dark:border-gray-800 mb-6 relative z-10">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enlisted On</p>
                                                    <p className="text-xs font-bold dark:text-gray-300">{format(new Date(emp.joiningDate || emp.createdAt), 'dd MMM yyyy')}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reports To</p>
                                                    <p className="text-xs font-bold dark:text-gray-300">{emp.reportsTo?.name || 'HQ COMMAND'}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 relative z-10">
                                                {emp.status !== 'Exited' && isAdmin ? (
                                                    <button
                                                        onClick={() => handleExit(emp._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Offboard
                                                    </button>
                                                ) : emp.status === 'Exited' && (
                                                    <button
                                                        onClick={() => downloadExperienceLetter(emp._id)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <FileText className="w-4 h-4" /> Letter
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => toast.success(`Viewing full intel for ${emp.name}`)}
                                                    className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary-500 text-gray-400 hover:text-white rounded-2xl transition-all"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Training Tab */}
                    {activeTab === 'training' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-black dark:text-white flex items-center gap-3 px-2">
                                <GraduationCap className="w-6 h-6 text-indigo-500" />
                                Skill Enhancement
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trainings.length > 0 ? trainings.map(train => (
                                    <div key={train._id} className="card p-6 space-y-6 group hover:-translate-y-1 transition-all border-t-8 border-indigo-500">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                                                <Award className="w-7 h-7" />
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                {train.status}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">{train.title}</h3>
                                            <p className="text-sm font-bold text-gray-500 mt-2 line-clamp-2">{train.skillTaught} • Module: {train.level}</p>
                                        </div>
                                        <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-y border-gray-100 dark:border-gray-800 py-4">
                                            <span className="flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400" /> {train.attendees?.length || 0} enrolled</span>
                                            <span className="flex items-center gap-2">Starts {format(new Date(train.startDate), 'MMM dd')}</span>
                                        </div>
                                        <button className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-primary-600 hover:text-white">Detailed Intel</button>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-32 text-center card bg-gray-50/50 dark:bg-gray-800/30 border-dashed">
                                        <Award className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                                        <p className="text-gray-400 font-black uppercase tracking-[0.3em]">No Training Blueprints Found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Field Tab */}
                    {activeTab === 'field' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                            <div className="lg:col-span-8 space-y-6">
                                <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <h3 className="font-black dark:text-white uppercase tracking-tight flex items-center gap-3 text-lg">
                                        <MapPin className="w-6 h-6 text-rose-500" /> Remote Intelligence
                                    </h3>
                                    <button className="btn w-full sm:w-auto bg-primary-500 text-white text-[10px] font-black uppercase border-none px-6">Live Map View</button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {visits.length > 0 ? visits.map(visit => (
                                        <div key={visit._id} className="card p-6 flex flex-col sm:flex-row items-center justify-between group hover:border-primary-500/30 transition-all gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                                    <MapPin className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-lg font-black dark:text-white uppercase truncate tracking-tight">{visit.clientName}</p>
                                                    <p className="text-xs font-bold text-gray-400 group-hover:text-primary-500 transition-colors uppercase">{visit.employee?.name} • {format(new Date(visit.checkInTime), 'h:mm a')}</p>
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-800">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{visit.status}</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white mt-1 uppercase">{format(new Date(visit.checkInTime), 'dd MMM')}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="card p-20 text-center text-gray-400 uppercase font-black tracking-widest bg-gray-50/50 dark:bg-gray-800/30">
                                            No Field Activity Recorded
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="lg:col-span-4 space-y-6">
                                <div className="card p-8 bg-gradient-to-br from-gray-900 to-indigo-950 text-white relative overflow-hidden group">
                                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -mr-24 blur-3xl transition-transform group-hover:scale-150"></div>
                                    <h3 className="font-black uppercase tracking-[0.1em] text-xl mb-4 relative z-10">Force Readiness</h3>
                                    <p className="text-xs text-indigo-200/60 mb-8 relative z-10 uppercase font-bold tracking-widest">Active nodes across 4 operational sectors.</p>

                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-3">
                                            <div className="flex items-end justify-between">
                                                <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Global Coverage</span>
                                                <span className="text-2xl font-black">75%</span>
                                            </div>
                                            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
                                                <div className="bg-indigo-400 w-[75%] h-full rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Active Units</p>
                                                <p className="text-xl font-black">12</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Target Meets</p>
                                                <p className="text-xl font-black">89%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Compliance Tab */}
                    {activeTab === 'compliance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="card p-8 space-y-8 border-l-8 border-emerald-500">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10">
                                        <Shield className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Governance Vault</h3>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">PF, ESI & Statutory filings</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { id: 1, label: 'PF Filing Period', defaultStatus: 'Compliant', date: 'Feb 2026', type: 'PF' },
                                        { id: 2, label: 'ESI Contribution', defaultStatus: 'Compliant', date: 'Feb 2026', type: 'ESI' },
                                        { id: 3, label: 'TDS Remittance', defaultStatus: 'Pending', date: 'Mar 2026', type: 'TDS' },
                                    ].map(item => {
                                        const localStatus = localStorage.getItem(`gov_${item.id}`) || item.defaultStatus;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    const nextStatus = localStatus === 'Compliant' ? 'Pending' : 'Compliant';
                                                    localStorage.setItem(`gov_${item.id}`, nextStatus);
                                                    toast.success(`${item.label} updated to ${nextStatus}`);
                                                    // Force a re-render
                                                    setActiveTab(activeTab);
                                                }}
                                                className="flex justify-between items-center p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl group border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                                        {item.type}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black dark:text-white uppercase tracking-tight">{item.label}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.date}</p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em]",
                                                    localStatus === 'Compliant' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                                                )}>{localStatus}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Ops;
