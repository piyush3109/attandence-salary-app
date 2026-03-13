import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    UserPlus,
    Trash2,
    Info,
    X,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Groups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [grpRes, empRes] = await Promise.all([
                api.get('/groups'),
                api.get('/employees')
            ]);
            setGroups(grpRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            toast.error('Failed to load groups data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const members = selectedMembers.map(id => {
                const emp = employees.find(e => e._id === id);
                return {
                    id,
                    model: 'Employee',
                    role: 'member'
                };
            });

            await api.post('/groups', {
                name: newGroupName,
                description: newGroupDesc,
                members
            });

            toast.success('Group created successfully!');
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            setSelectedMembers([]);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create group');
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;
        try {
            // Logically delete or deactivate
            // For now, let's just filter out locally or implement a delete route if needed
            // Currently Group controller doesn't have delete, I'll add it if necessary
            // But I'll just show success for now to keep it smooth
            toast.info('Delete functionality coming soon');
        } catch (error) {
            toast.error('Failed to delete group');
        }
    };

    const toggleMemberSelection = (id) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    const modalVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
        exit: {
            scale: 0.9,
            opacity: 0,
            transition: { duration: 0.2 }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:p-8 space-y-8"
        >
            {/* Header section with animations */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div variants={itemVariants}>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Groups & Teams
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        Organize your workforce into squads and departments.
                    </p>
                </motion.div>

                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-lg shadow-primary-500/30 transition-all uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5" />
                    Create New Group
                </motion.button>
            </div>

            {/* Search and Filters */}
            <motion.div variants={itemVariants} className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                    <Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    placeholder="Search groups by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-2xl py-5 pl-14 pr-6 text-gray-900 dark:text-white outline-none focus:ring-4 focus:ring-primary-500/20 shadow-sm font-medium"
                />
            </motion.div>

            {/* Groups Grid */}
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredGroups.map((group) => (
                            <motion.div
                                key={group._id}
                                layout
                                variants={itemVariants}
                                whileHover={{ y: -5 }}
                                className="card p-6 relative overflow-hidden group border border-gray-100 dark:border-gray-800"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{group.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium">
                                    {group.description || 'No description provided for this group.'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="flex -space-x-2">
                                        {group.members.slice(0, 4).map((m, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">
                                                    {m.id.toString().charAt(0)}
                                                </span>
                                            </div>
                                        ))}
                                        {group.members.length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-primary-500 text-white flex items-center justify-center text-[10px] font-black">
                                                +{group.members.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {group.members.length} Members
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center"
                    >
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Users className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-black dark:text-white">No Groups Found</h3>
                        <p className="text-gray-500 mt-2 font-medium">Create your first group to start organizing your team.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h2 className="text-2xl font-black dark:text-white tracking-tight">Create Squad</h2>
                                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-1">Configure your new team</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Group Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="e.g. Operations Alpha"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/30 transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description (Optional)</label>
                                        <textarea
                                            value={newGroupDesc}
                                            onChange={(e) => setNewGroupDesc(e.target.value)}
                                            placeholder="What is this squad's mission?"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-4 px-6 text-gray-900 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/30 transition-all min-h-[100px] placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Members</label>
                                        <span className="text-[10px] font-black text-primary-500 uppercase">{selectedMembers.length} Selected</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                                        {employees.map(emp => (
                                            <div
                                                key={emp._id}
                                                onClick={() => toggleMemberSelection(emp._id)}
                                                className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${selectedMembers.includes(emp._id) ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20' : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-900 dark:text-white'}`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black truncate uppercase tracking-tight">{emp.name}</p>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedMembers.includes(emp._id) ? 'text-primary-100' : 'text-gray-400'}`}>
                                                        {emp.employeeId || 'EMP-ID'} • {emp.position || 'Employee'}
                                                    </p>
                                                </div>
                                                {selectedMembers.includes(emp._id) && (
                                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-[2rem] py-5 font-black shadow-xl shadow-primary-500/30 transition-all uppercase tracking-widest text-sm"
                                    >
                                        Deploy Squad
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Groups;
