import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const AnnouncementsBoard = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        priority: 'medium'
    });

    const isAdmin = ['admin', 'ceo', 'manager'].includes(user?.role);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await api.get('/announcements');
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/announcements', formData);
            toast.success('Announcement broadcasted');
            setShowModal(false);
            setFormData({ title: '', message: '', priority: 'medium' });
            fetchAnnouncements();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to post announcement');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement forever?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            toast.success('Announcement removed');
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to delete announcement');
        }
    };

    const priorityColors = {
        low: 'bg-gray-100 text-gray-500',
        medium: 'bg-blue-100 text-blue-600',
        high: 'bg-orange-100 text-orange-600',
        critical: 'bg-rose-100 text-rose-600 animate-pulse'
    };

    if (loading) {
        return <div className="animate-pulse h-40 bg-gray-100 dark:bg-gray-800 rounded-3xl" />;
    }

    return (
        <div className="card p-5 md:p-8 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-indigo-500" />
                    Notice Board
                </h3>
                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-4 py-2 text-xs border-none shadow-none flex items-center gap-2 h-auto"
                    >
                        <Plus className="w-4 h-4" /> Broadcast
                    </button>
                )}
            </div>

            <div className="space-y-4 relative z-10 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {announcements.length === 0 ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm font-medium">No announcements right now.</p>
                    </div>
                ) : (
                    announcements.map((ann) => (
                        <div key={ann._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div className="flex justify-between items-start mb-2">
                                <div className="space-y-1">
                                    <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest", priorityColors[ann.priority])}>
                                        {ann.priority} priority
                                    </span>
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{ann.title}</h4>
                                </div>
                                {isAdmin && (
                                    <button onClick={() => handleDelete(ann._id)} className="text-gray-400 hover:text-rose-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-[10px] uppercase font-bold text-gray-500">
                                <span>{ann.publishedBy?.username || ann.publishedBy?.name || 'Admin'}</span>
                                <span>{format(new Date(ann.createdAt), 'MMM dd, h:mm a')}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Announcement Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="card w-full max-w-lg p-6 space-y-6 animate-in zoom-in-95 duration-300 relative z-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-indigo-500" /> New Broadcast
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                                <input
                                    required
                                    className="input font-bold"
                                    placeholder="e.g. Office closed tomorrow"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message content</label>
                                <textarea
                                    required
                                    className="input min-h-[100px] py-3"
                                    placeholder="Provide detailed instructions..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</label>
                                <select
                                    className="input"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <button type="submit" className="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full h-12">
                                Publish Broadcast
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsBoard;
