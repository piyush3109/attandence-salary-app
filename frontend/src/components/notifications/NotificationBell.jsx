import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, Info, Megaphone, MessageSquare, CalendarCheck, IndianRupee, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSocket, connectSocket } from '../../utils/socket';
import api from '../../utils/api';

const NOTIFICATION_ICONS = {
    announcement: Megaphone,
    message: MessageSquare,
    attendance: CalendarCheck,
    salary: IndianRupee,
    leave: AlertTriangle,
    employee: UserPlus,
    general: Info,
};

const PRIORITY_COLORS = {
    high: 'from-red-500 to-rose-600',
    medium: 'from-amber-500 to-orange-600',
    low: 'from-blue-500 to-cyan-600',
};

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [animateBell, setAnimateBell] = useState(false);
    const panelRef = useRef(null);
    const bellRef = useRef(null);

    // Load notifications from localStorage
    useEffect(() => {
        if (!user) return;
        const stored = localStorage.getItem(`notifications_${user._id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setNotifications(parsed);
                setUnreadCount(parsed.filter(n => !n.read).length);
            } catch (e) {
                // ignore
            }
        }
    }, [user]);

    // Save notifications to localStorage
    const saveNotifications = (notifs) => {
        if (!user) return;
        localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifs.slice(0, 50))); // keep max 50
    };

    // Add a notification
    const addNotification = (notification) => {
        const newNotif = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            ...notification,
            read: false,
            timestamp: new Date().toISOString(),
        };

        setNotifications(prev => {
            const updated = [newNotif, ...prev].slice(0, 50);
            saveNotifications(updated);
            return updated;
        });
        setUnreadCount(prev => prev + 1);

        // Bell animation
        setAnimateBell(true);
        setTimeout(() => setAnimateBell(false), 1000);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(notification.title || 'New Notification', {
                    body: notification.message,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png',
                    tag: newNotif.id,
                });
            } catch (e) {
                // Silent fail for environments that don't support notifications
            }
        }
    };

    // Socket.IO real-time listeners
    useEffect(() => {
        if (!user) return;

        const socket = connectSocket(user._id);

        // Listen for announcements
        socket.on('new_announcement', (data) => {
            addNotification({
                type: 'announcement',
                title: '📢 New Announcement',
                message: data.title || data.message || 'A new announcement has been posted',
                priority: data.priority || 'medium',
                data: data,
            });
        });

        // Listen for new messages
        socket.on('new_message', (data) => {
            addNotification({
                type: 'message',
                title: '💬 New Message',
                message: data.content || 'You received a new message',
                priority: 'low',
                data: data,
            });
        });

        // Listen for attendance updates
        socket.on('attendance_update', (data) => {
            addNotification({
                type: 'attendance',
                title: '📋 Attendance Update',
                message: data.message || 'Your attendance has been updated',
                priority: 'medium',
                data: data,
            });
        });

        // Listen for salary updates
        socket.on('salary_update', (data) => {
            addNotification({
                type: 'salary',
                title: '💰 Salary Update',
                message: data.message || 'Your salary details have been updated',
                priority: 'high',
                data: data,
            });
        });

        // Listen for leave updates
        socket.on('leave_update', (data) => {
            addNotification({
                type: 'leave',
                title: '🏖️ Leave Update',
                message: data.message || 'Your leave status has been updated',
                priority: 'medium',
                data: data,
            });
        });

        // Listen for new employee joins
        socket.on('employee_joined', (data) => {
            addNotification({
                type: 'employee',
                title: '👋 New Employee',
                message: `${data.name || 'Someone'} has joined the team!`,
                priority: 'low',
                data: data,
            });
        });

        // Generic notification channel
        socket.on('notification', (data) => {
            addNotification({
                type: data.type || 'general',
                title: data.title || '🔔 Notification',
                message: data.message,
                priority: data.priority || 'medium',
                data: data,
            });
        });

        return () => {
            socket.off('new_announcement');
            socket.off('new_message');
            socket.off('attendance_update');
            socket.off('salary_update');
            socket.off('leave_update');
            socket.off('employee_joined');
            socket.off('notification');
        };
    }, [user]);

    // Fetch announcements on mount as initial notifications
    useEffect(() => {
        if (!user) return;
        const fetchAnnouncements = async () => {
            try {
                const { data } = await api.get('/announcements');
                if (data && data.length > 0) {
                    const existing = JSON.parse(localStorage.getItem(`notifications_${user._id}`) || '[]');
                    const existingIds = new Set(existing.map(n => n.data?._id));

                    data.slice(0, 5).forEach(ann => {
                        if (!existingIds.has(ann._id)) {
                            addNotification({
                                type: 'announcement',
                                title: `📢 ${ann.title}`,
                                message: ann.message,
                                priority: ann.priority || 'medium',
                                data: ann,
                            });
                        }
                    });
                }
            } catch (e) {
                // Silently fail
            }
        };
        fetchAnnouncements();
    }, [user]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current && !panelRef.current.contains(event.target) &&
                bellRef.current && !bellRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Request browser notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const markAsRead = (id) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
            saveNotifications(updated);
            setUnreadCount(updated.filter(n => !n.read).length);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifications(updated);
            setUnreadCount(0);
            return updated;
        });
    };

    const deleteNotification = (id) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            saveNotifications(updated);
            setUnreadCount(updated.filter(n => !n.read).length);
            return updated;
        });
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
        if (user) localStorage.removeItem(`notifications_${user._id}`);
    };

    const timeAgo = (timestamp) => {
        const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (!user) return null;

    return (
        <>
            {/* Notification Bell Button */}
            <button
                ref={bellRef}
                id="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-3 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group ${animateBell ? 'animate-bounce' : ''}`}
            >
                <Bell className={`w-5 h-5 transition-all duration-300 ${isOpen ? 'text-primary-500 scale-110' : 'text-gray-600 dark:text-gray-300 group-hover:text-primary-500'} ${animateBell ? 'animate-[ring_0.5s_ease-in-out]' : ''}`} />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}

                {/* Pulse ring animation for unread */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-30" />
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="fixed top-20 right-4 md:right-8 w-[calc(100vw-2rem)] max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-[100] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300"
                    style={{ maxHeight: 'calc(100vh - 6rem)' }}
                >
                    {/* Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-500/5 to-blue-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Notifications</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-2 text-xs font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-2 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">No notifications yet</p>
                                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">You'll see updates here</p>
                            </div>
                        ) : (
                            notifications.map((notif, index) => {
                                const IconComponent = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.general;
                                const priorityColor = PRIORITY_COLORS[notif.priority] || PRIORITY_COLORS.medium;

                                return (
                                    <div
                                        key={notif.id}
                                        className={`p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-all duration-200 cursor-pointer group ${!notif.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${priorityColor} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-bold truncate ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {!notif.read && (
                                                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                            className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-semibold">{timeAgo(notif.timestamp)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default NotificationBell;
