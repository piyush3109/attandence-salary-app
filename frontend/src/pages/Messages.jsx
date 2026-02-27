import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSocket, connectSocket, joinConversation, leaveConversation, emitMessage, emitTyping, emitStopTyping } from '../utils/socket';
import EmojiPicker from 'emoji-picker-react';
import {
    MessageSquare,
    Send,
    Search,
    MoreVertical,
    Paperclip,
    Smile,
    ArrowLeft,
    Image as ImageIcon,
    FileText,
    X,
    Download,
    Film,
    Loader2,
    Pencil,
    Trash2
} from 'lucide-react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

// ─── Date Separator ─────────────────────────────────────
const DateSeparator = ({ date }) => {
    const d = new Date(date);
    let label;
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else label = format(d, 'EEEE, dd MMMM yyyy');

    return (
        <div className="flex items-center gap-4 my-4 md:my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{label}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
    );
};

// ─── GIF Picker Component ───────────────────────────────
const GifPicker = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchGifs = useCallback(async (q) => {
        setLoading(true);
        try {
            const endpoint = q
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
            const res = await fetch(endpoint);
            const data = await res.json();
            setGifs(data.data || []);
        } catch {
            toast.error('Failed to load GIFs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { searchGifs(''); }, [searchGifs]);

    useEffect(() => {
        const timer = setTimeout(() => searchGifs(query), 400);
        return () => clearTimeout(timer);
    }, [query, searchGifs]);

    return (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden z-50" style={{ maxHeight: '360px' }}>
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search GIFs..." value={query} onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium outline-none dark:text-white placeholder:text-gray-400" autoFocus />
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
            <div className="overflow-y-auto p-2 grid grid-cols-2 gap-2" style={{ maxHeight: '300px' }}>
                {loading ? (
                    <div className="col-span-2 flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
                ) : gifs.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-400 text-sm font-medium">No GIFs found</div>
                ) : gifs.map((gif) => (
                    <button key={gif.id} onClick={() => onSelect(gif.images.fixed_height.url)}
                        className="rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all aspect-video bg-gray-100 dark:bg-gray-800">
                        <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                ))}
            </div>
            <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Powered by GIPHY</span>
            </div>
        </div>
    );
};

// ─── File Preview Component ─────────────────────────────
const FilePreview = ({ file, onRemove }) => (
    <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
        {file.type?.startsWith('image/') ? (
            <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
            <FileText className="w-5 h-5 text-primary-500" />
        )}
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold dark:text-white truncate">{file.name}</p>
            <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button onClick={onRemove} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            <X className="w-4 h-4 text-red-500" />
        </button>
    </div>
);

// ─── Message Bubble Component ───────────────────────────
const MessageBubble = React.memo(({ msg, isMe, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        if (showMenu) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showMenu]);

    const canEdit = isMe && msg.messageType === 'text' &&
        ((Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60)) < 15;

    const renderContent = () => {
        switch (msg.messageType) {
            case 'image':
                return (
                    <div className="space-y-2">
                        <a href={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`} target="_blank" rel="noopener noreferrer">
                            <img src={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`}
                                alt={msg.attachment?.filename} className="max-w-[280px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                        </a>
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                    </div>
                );
            case 'file':
                return (
                    <div className="space-y-2">
                        <a href={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`}
                            target="_blank" rel="noopener noreferrer"
                            className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                isMe ? "bg-white/10 hover:bg-white/20" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600")}>
                            <FileText className="w-5 h-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">{msg.attachment?.filename}</p>
                                <p className="text-[10px] opacity-60">{msg.attachment?.size ? `${(msg.attachment.size / 1024).toFixed(1)} KB` : 'File'}</p>
                            </div>
                            <Download className="w-4 h-4 shrink-0 opacity-60" />
                        </a>
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                    </div>
                );
            case 'gif':
                return (
                    <div className="space-y-2">
                        <img src={msg.gifUrl} alt="GIF" className="max-w-[260px] rounded-2xl" loading="lazy" />
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                    </div>
                );
            default:
                return <span>{msg.content}</span>;
        }
    };

    return (
        <div className={cn("max-w-[80%] md:max-w-[65%] flex flex-col group relative", isMe ? "self-end items-end" : "self-start items-start")}>
            <div className="relative">
                {isMe && (
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10" ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-full top-0 mr-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[120px] z-50">
                                {canEdit && (
                                    <button onClick={() => { setShowMenu(false); onEdit?.(msg); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                                <button onClick={() => { setShowMenu(false); onDelete?.(msg); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <div className={cn(
                    "px-5 py-3.5 rounded-[1.5rem] text-sm font-bold shadow-lg shadow-primary-500/5",
                    isMe ? "bg-primary-600 text-white rounded-tr-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-200 dark:border-gray-700"
                )}>
                    {renderContent()}
                </div>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 px-3">
                {format(new Date(msg.createdAt), 'hh:mm a')} · {format(new Date(msg.createdAt), 'dd MMM')}
                {msg.isEdited && <span className="ml-1 text-gray-500 italic normal-case">(edited)</span>}
            </span>
        </div>
    );
});

// ─── Main Messages Component ────────────────────────────
const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [isMobileListOpen, setIsMobileListOpen] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    // Feature states
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [sending, setSending] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);
    const prevConvRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // ─── Socket.IO Real-time Setup ──────────────────────
    useEffect(() => {
        if (!user?._id) return;
        const socket = connectSocket(user._id);

        socket.on('new_message', (message) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        });

        socket.on('online_users', (users) => {
            setOnlineUsers(users);
        });

        socket.on('conversation_update', () => {
            fetchConversations();
        });

        socket.on('user_typing', (data) => {
            setTypingUser(data);
        });

        socket.on('user_stop_typing', () => {
            setTypingUser(null);
        });

        socket.on('message_edited', (data) => {
            setMessages(prev => prev.map(m =>
                m._id === data.messageId ? { ...m, content: data.content, isEdited: true } : m
            ));
        });

        socket.on('message_deleted', (data) => {
            setMessages(prev => prev.filter(m => m._id !== data.messageId));
        });

        return () => {
            socket.off('new_message');
            socket.off('online_users');
            socket.off('conversation_update');
            socket.off('user_typing');
            socket.off('user_stop_typing');
            socket.off('message_edited');
            socket.off('message_deleted');
        };
    }, [user?._id, scrollToBottom]);

    // ─── Initial Data Load ──────────────────────────────
    useEffect(() => {
        fetchConversations();
        fetchUsers();
    }, []);

    // ─── Active Chat Change ─────────────────────────────
    useEffect(() => {
        if (activeChat) {
            // Leave previous conversation room
            if (prevConvRef.current) {
                leaveConversation(prevConvRef.current);
            }
            // Join new conversation room
            const convId = activeChat.conversationId || `${user?._id}_${activeChat.otherUser.id}`;
            joinConversation(convId);
            prevConvRef.current = convId;

            fetchMessages(activeChat.otherUser.id);
            setIsMobileListOpen(false);
        }
    }, [activeChat]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Close emoji picker on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/messages/conversations');
            setConversations(data);
            setLoading(false);
        } catch { /* silent */ }
    };

    const fetchUsers = async () => {
        try {
            const [adminRes, empRes] = await Promise.all([
                api.get('/auth/admins'),
                api.get('/employees')
            ]);
            const candidates = [
                ...adminRes.data.map(a => ({ id: a._id, name: a.username, model: 'Admin', role: a.role, profilePhoto: a.profilePhoto })),
                ...empRes.data.map(e => ({ id: e._id, name: e.name, model: 'Employee', role: 'employee', profilePhoto: e.profilePhoto }))
            ].filter(u => u.id !== user?._id);
            setUsers(candidates);
        } catch { setUsers([]); }
    };

    const fetchMessages = async (otherUserId) => {
        try {
            const { data } = await api.get(`/messages/${otherUserId}`);
            setMessages(data);
        } catch { /* silent */ }
    };

    // ─── Typing Indicator ───────────────────────────────
    const handleTyping = () => {
        if (!activeChat) return;
        const convId = activeChat.conversationId || `${user?._id}_${activeChat.otherUser.id}`;
        emitTyping(convId, user?._id, user?.username);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(convId, user?._id);
        }, 2000);
    };

    // ─── Send Message ───────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeChat || sending) return;

        setSending(true);
        try {
            let data;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('receiverId', activeChat.otherUser.id);
                formData.append('receiverModel', activeChat.otherUser.model);
                formData.append('content', newMessage);
                const res = await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                data = res.data;
                setSelectedFile(null);
            } else {
                const res = await api.post('/messages', {
                    receiverId: activeChat.otherUser.id,
                    receiverModel: activeChat.otherUser.model,
                    content: newMessage,
                    messageType: 'text'
                });
                data = res.data;
            }
            setMessages(prev => [...prev, data]);
            setNewMessage('');

            // Emit via WebSocket for real-time delivery
            const convId = activeChat.conversationId || data.conversationId || `${user?._id}_${activeChat.otherUser.id}`;
            emitMessage(convId, data);
            fetchConversations();
        } catch (error) {
            toast.error('Message failed to send');
        } finally {
            setSending(false);
        }
    };

    const handleSendGif = async (gifUrl) => {
        if (!activeChat || sending) return;
        setSending(true);
        setShowGifPicker(false);
        try {
            const { data } = await api.post('/messages', {
                receiverId: activeChat.otherUser.id,
                receiverModel: activeChat.otherUser.model,
                content: '',
                messageType: 'gif',
                gifUrl
            });
            setMessages(prev => [...prev, data]);
            const convId = activeChat.conversationId || data.conversationId || `${user?._id}_${activeChat.otherUser.id}`;
            emitMessage(convId, data);
            fetchConversations();
        } catch { toast.error('Failed to send GIF'); }
        finally { setSending(false); }
    };

    const handleEmojiClick = (emojiData) => setNewMessage(prev => prev + emojiData.emoji);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) { toast.error('File must be under 25MB'); return; }
            setSelectedFile(file);
        }
    };

    // ─── Edit Message ───────────────────────────────────
    const handleStartEdit = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
    };

    const handleSaveEdit = async () => {
        if (!editingMessage || !editContent.trim()) return;
        try {
            const { data } = await api.put(`/messages/${editingMessage._id}`, { content: editContent.trim() });
            setMessages(prev => prev.map(m => m._id === data._id ? data : m));
            toast.success('Message edited');
            setEditingMessage(null);
            setEditContent('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to edit message');
        }
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setEditContent('');
    };

    // ─── Delete Message ─────────────────────────────────
    const handleDeleteMessage = async (msg) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await api.delete(`/messages/${msg._id}`);
            setMessages(prev => prev.filter(m => m._id !== msg._id));
            toast.success('Message deleted');
            fetchConversations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete message');
        }
    };

    const startNewChat = (selectedUser) => {
        setActiveChat({ otherUser: selectedUser });
        setSearchQuery('');
    };

    const filteredUsers = useMemo(() =>
        users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [users, searchQuery]
    );

    const isUserOnline = (userId) => onlineUsers.includes(userId);

    const getProfileAvatar = (chatUser) => {
        const photoUrl = chatUser?.profilePhoto;
        if (photoUrl) {
            const src = photoUrl.startsWith('http') ? photoUrl : `${API_BASE}${photoUrl}`;
            return <img src={src} alt={chatUser.name} className="w-full h-full object-cover" />;
        }
        return <span className="text-primary-600 dark:text-primary-400 font-black text-lg">{chatUser?.name?.charAt(0)?.toUpperCase()}</span>;
    };

    // ─── Group messages by date ─────────────────────────
    const messageGroups = useMemo(() => {
        const groups = [];
        let lastDate = null;
        messages.forEach((msg) => {
            const msgDate = new Date(msg.createdAt);
            if (!lastDate || !isSameDay(lastDate, msgDate)) {
                groups.push({ type: 'date', date: msg.createdAt });
                lastDate = msgDate;
            }
            groups.push({ type: 'message', data: msg });
        });
        return groups;
    }, [messages]);

    return (
        <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-180px)] flex flex-col md:flex-row gap-3 md:gap-6">
            {/* ─── Conversation List ─────────────────────── */}
            <div className={cn(
                "w-full md:w-80 xl:w-96 flex flex-col bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl shadow-primary-500/5",
                !isMobileListOpen && "hidden md:flex"
            )}>
                <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Messages</h2>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input type="text" placeholder="Search people..."
                            className="w-full pl-12 pr-4 py-2.5 md:py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl md:rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary-500 transition-all dark:text-white"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {searchQuery ? (
                        <div className="px-3 md:px-4 space-y-1">
                            {filteredUsers.map(u => (
                                <button key={u.id} onClick={() => startNewChat(u)}
                                    className="w-full flex items-center gap-3 p-3 md:p-4 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-2xl md:rounded-3xl transition-all text-left">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                                            {getProfileAvatar(u)}
                                        </div>
                                        {isUserOnline(u.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black dark:text-white uppercase truncate">{u.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                                    </div>
                                </button>
                            ))}
                            {filteredUsers.length === 0 && <p className="text-center text-xs text-gray-400 py-6 font-medium">No users found</p>}
                        </div>
                    ) : (
                        <div className="px-3 md:px-4 space-y-1">
                            {conversations.map((conv) => (
                                <button key={conv.conversationId} onClick={() => setActiveChat(conv)}
                                    className={cn(
                                        "w-full flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-2xl md:rounded-[2rem] transition-all text-left group relative",
                                        activeChat?.conversationId === conv.conversationId
                                            ? "bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    )}>
                                    <div className="relative">
                                        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                            {getProfileAvatar(conv.otherUser)}
                                        </div>
                                        {isUserOnline(conv.otherUser.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                        {!conv.isRead && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-primary-600 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className="text-xs md:text-sm font-black dark:text-white uppercase truncate">{conv.otherUser.name}</p>
                                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 shrink-0 ml-2">{format(new Date(conv.updatedAt), 'hh:mm a')}</p>
                                        </div>
                                        <p className={cn("text-[11px] md:text-xs truncate", !conv.isRead ? "font-black text-gray-900 dark:text-white" : "text-gray-500 font-medium")}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && !loading && (
                                <div className="py-10 text-center space-y-3 opacity-50">
                                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-10">No conversations yet. Search above to start chatting.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Chat Area ─────────────────────────────── */}
            <div className={cn(
                "flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl shadow-primary-500/5",
                isMobileListOpen && "hidden md:flex"
            )}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <button onClick={() => { setIsMobileListOpen(true); setShowEmojiPicker(false); setShowGifPicker(false); }}
                                    className="md:hidden p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <ArrowLeft className="w-5 h-5 dark:text-white" />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary-500/10 flex items-center justify-center overflow-hidden">
                                        {getProfileAvatar(activeChat.otherUser)}
                                    </div>
                                    {isUserOnline(activeChat.otherUser.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{activeChat.otherUser.name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        {typingUser ? (
                                            <span className="text-[9px] md:text-[10px] font-black text-primary-500 italic animate-pulse">typing...</span>
                                        ) : (
                                            <>
                                                <div className={cn("w-2 h-2 rounded-full", isUserOnline(activeChat.otherUser.id) ? "bg-emerald-500 animate-pulse" : "bg-gray-300")} />
                                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    {isUserOnline(activeChat.otherUser.id) ? 'Online' : 'Offline'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-800 text-gray-400">
                                <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Messages Area with Date Groups */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 md:p-8 space-y-3 md:space-y-4 scrollbar-hide flex flex-col">
                            {messages.length === 0 && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center space-y-3 opacity-40">
                                        <MessageSquare className="w-10 h-10 mx-auto text-gray-300" />
                                        <p className="text-xs font-bold text-gray-400">Start a conversation</p>
                                    </div>
                                </div>
                            )}
                            {messageGroups.map((item, idx) => {
                                if (item.type === 'date') {
                                    return <DateSeparator key={`date-${idx}`} date={item.date} />;
                                }
                                const msg = item.data;
                                const isMe = msg.sender.id === user?._id;
                                return <MessageBubble key={msg._id} msg={msg} isMe={isMe} onEdit={handleStartEdit} onDelete={handleDeleteMessage} />;
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Edit Message Bar */}
                        {editingMessage && (
                            <div className="px-4 py-3 border-t border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 flex items-center gap-3">
                                <Pencil className="w-4 h-4 text-primary-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Editing Message</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                                            className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded-xl text-sm font-bold border border-primary-200 dark:border-primary-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                            autoFocus
                                        />
                                        <button onClick={handleSaveEdit}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black hover:bg-primary-500 transition-colors">
                                            Save
                                        </button>
                                        <button onClick={handleCancelEdit}
                                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 md:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                            {selectedFile && (
                                <div className="mb-3">
                                    <FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} />
                                </div>
                            )}

                            <div className="relative">
                                {showEmojiPicker && (
                                    <div ref={emojiRef} className="absolute bottom-full mb-2 left-0 z-50">
                                        <EmojiPicker onEmojiClick={handleEmojiClick} width={window.innerWidth < 640 ? 280 : 350} height={350}
                                            theme="auto" searchPlaceholder="Search emoji..." previewConfig={{ showPreview: false }} />
                                    </div>
                                )}
                                {showGifPicker && <GifPicker onSelect={handleSendGif} onClose={() => setShowGifPicker(false)} />}

                                <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 items-center">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.mp4,.webm,.mp3,.wav" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="p-2.5 md:p-3 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all" title="Attach file">
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <button type="button" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                                        className={cn("p-2.5 md:p-3 rounded-xl transition-all hidden sm:block",
                                            showGifPicker ? "text-primary-500 bg-primary-50 dark:bg-primary-900/20" : "text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                        )} title="Send GIF">
                                        <Film className="w-5 h-5" />
                                    </button>

                                    <div className="flex-1 relative group">
                                        <input className="w-full pl-4 md:pl-6 pr-10 md:pr-12 py-3 md:py-4 bg-white dark:bg-gray-800 border-none rounded-xl md:rounded-[1.5rem] text-sm font-bold shadow-lg shadow-primary-500/5 focus:ring-4 focus:ring-primary-500/10 transition-all dark:text-white"
                                            placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                                            value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} />
                                        <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                                            className={cn("absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all",
                                                showEmojiPicker ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" : "text-gray-400 hover:text-amber-500")}>
                                            <Smile className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || sending}
                                        className="p-3 md:p-4 bg-primary-600 text-white rounded-xl md:rounded-[1.5rem] shadow-xl shadow-primary-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all">
                                        {sending ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12 space-y-6 md:space-y-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center relative z-10">
                                <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-gray-300" />
                            </div>
                        </div>
                        <div className="space-y-2 relative z-10 max-w-sm">
                            <h3 className="text-xl md:text-2xl font-black dark:text-white uppercase tracking-tight leading-none">Messages</h3>
                            <p className="text-gray-500 font-medium text-sm md:text-base">Select a conversation or search for someone to start chatting.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
