import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSocket, connectSocket, joinConversation, leaveConversation, emitMessage, emitTyping, emitStopTyping } from '../utils/socket';
import EmojiPicker from 'emoji-picker-react';
import {
    MessageSquare, Send, Search, MoreVertical, Paperclip, Smile, ArrowLeft,
    FileText, X, Download, Film, Loader2, Pencil, Trash2, Mic, Square, Reply, Check
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
    let label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, dd MMMM yyyy');
    return (
        <div className="flex items-center gap-4 my-4 md:my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">{label}</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
    );
};

// ─── GIF Picker ─────────────────────────────────────────
const GifPicker = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchGifs = useCallback(async (q) => {
        setLoading(true);
        try {
            const endpoint = q ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;
            const res = await fetch(endpoint);
            const data = await res.json();
            setGifs(data.data || []);
        } catch { toast.error('Failed to load GIFs'); }
        finally { setLoading(false); }
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
                {loading ? <div className="col-span-2 flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
                    : gifs.length === 0 ? <div className="col-span-2 text-center py-8 text-gray-400 text-sm font-medium">No GIFs found</div>
                        : gifs.map((gif) => (
                            <button key={gif.id} onClick={() => onSelect(gif.images.fixed_height.url)}
                                className="rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all aspect-video bg-gray-100 dark:bg-gray-800">
                                <img src={gif.images.fixed_height_small.url} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                        ))}
            </div>
        </div>
    );
};

// ─── Message Bubble ─────────────────────────────────────
const MessageBubble = React.memo(({ msg, isMe, onEdit, onDelete, onReply }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
        if (showMenu) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showMenu]);

    const canEdit = isMe && msg.messageType === 'text' && !msg.isDeleted &&
        ((Date.now() - new Date(msg.createdAt).getTime()) / (1000 * 60)) < 15;

    return (
        <div className={cn("flex flex-col group relative max-w-[85%] md:max-w-[70%]", isMe ? "self-end items-end" : "self-start items-start")}>
            <div className="relative flex items-center gap-2">

                {/* Left side actions (for my messages) */}
                {isMe && !msg.isDeleted && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" ref={menuRef}>
                        <button onClick={() => onReply(msg)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all" title="Reply">
                            <Reply className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="More">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-full top-0 mr-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[120px] z-50">
                                {canEdit && (
                                    <button onClick={() => { setShowMenu(false); onEdit?.(msg); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                                <button onClick={() => { setShowMenu(false); onDelete?.(msg); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* The Bubble */}
                <div className={cn(
                    "px-4 py-2.5 md:px-5 md:py-3.5 rounded-[1.25rem] md:rounded-[1.5rem] shadow-sm",
                    isMe ? "bg-primary-600 text-white rounded-tr-sm" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm border border-gray-100 dark:border-gray-800",
                    msg.isDeleted ? "opacity-60 italic bg-gray-100 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 text-gray-500 dark:text-gray-400" : ""
                )}>
                    {msg.replyTo && !msg.isDeleted && (
                        <div className="mb-2 p-2 bg-black/10 dark:bg-white/5 rounded-lg border-l-4 border-primary-300 dark:border-primary-500 text-xs text-left max-w-full">
                            <p className="font-bold mb-0.5 opacity-80">{msg.replyTo.senderName}</p>
                            <p className="opacity-90 truncate line-clamp-1">
                                {msg.replyTo.messageType === 'image' ? '📷 Photo' :
                                    msg.replyTo.messageType === 'file' ? '📎 Attachment' :
                                        msg.replyTo.messageType === 'audio' ? '🎙️ Voice note' :
                                            msg.replyTo.messageType === 'gif' ? '🎬 GIF' :
                                                msg.replyTo.contentPreview}
                            </p>
                        </div>
                    )}

                    {msg.isDeleted ? (
                        <div className="flex items-center gap-2 pr-4 text-xs font-medium">
                            <Trash2 className="w-4 h-4 opacity-70" /> This message was deleted
                        </div>
                    ) : (
                        <div className="space-y-2 relative">
                            {msg.messageType === 'image' && (
                                <a href={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`}
                                        alt="attached" className="max-w-[240px] md:max-w-[280px] max-h-[300px] object-contain rounded-xl bg-black/5" loading="lazy" />
                                </a>
                            )}
                            {msg.messageType === 'file' && (
                                <a href={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`} target="_blank" rel="noopener noreferrer"
                                    className={cn("flex items-center gap-3 p-3 rounded-xl transition-all border", isMe ? "bg-black/10 border-black/5 hover:bg-black/20" : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-600")}>
                                    <FileText className="w-5 h-5 shrink-0 opacity-80" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold truncate max-w-[150px]">{msg.attachment?.filename}</p>
                                        <p className="text-[10px] opacity-70">{msg.attachment?.size ? `${(msg.attachment.size / 1024).toFixed(1)} KB` : 'File'}</p>
                                    </div>
                                    <Download className="w-4 h-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity bg-white/20 p-1 rounded-full box-content" />
                                </a>
                            )}
                            {msg.messageType === 'gif' && (
                                <img src={msg.gifUrl} alt="GIF" className="max-w-[220px] md:max-w-[260px] rounded-xl" loading="lazy" />
                            )}
                            {msg.messageType === 'audio' && (
                                <div className="min-w-[180px] md:min-w-[220px]">
                                    <audio controls className="h-10 w-full outline-none" src={msg.attachment?.url?.startsWith('http') ? msg.attachment.url : `${API_BASE}${msg.attachment?.url}`} />
                                </div>
                            )}

                            {msg.content && <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>}
                        </div>
                    )}
                </div>

                {/* Right side actions (for their messages) */}
                {!isMe && !msg.isDeleted && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex" ref={menuRef}>
                        <button onClick={() => onReply(msg)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all" title="Reply">
                            <Reply className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1.5 px-2">
                {format(new Date(msg.createdAt), 'hh:mm a')}
                {msg.isEdited && !msg.isDeleted && <span className="ml-1 opacity-60 italic">(edited)</span>}
            </span>
        </div>
    );
});

// ─── Main Messages Component ────────────────────────────
const Messages = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [showAllUsers, setShowAllUsers] = useState(false);
    const [isMobileListOpen, setIsMobileListOpen] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    // Feature states
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showChatOptions, setShowChatOptions] = useState(false);

    const [sending, setSending] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);
    const prevConvRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    }, []);

    // Scroll automatically when messages change or components load
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages, activeChat, scrollToBottom]);

    // ─── Socket.IO Real-time Setup ──────────────────────
    useEffect(() => {
        if (!user?._id) return;
        const socket = getSocket() || connectSocket(user._id);
        if (socket.disconnected) socket.connect();

        const handleNewMessage = (message) => {
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        };

        const handleOnlineUsers = (users) => setOnlineUsers(users);
        const handleConvUpdate = () => fetchConversations();

        const handleUserTyping = (data) => {
            if (activeChat && (data.conversationId === activeChat.conversationId || data.conversationId === prevConvRef.current)) {
                setTypingUser(data);
            }
        };

        const handleUserStopTyping = (data) => {
            if (activeChat && (data.conversationId === activeChat.conversationId || data.conversationId === prevConvRef.current)) {
                setTypingUser(null);
            }
        };

        const handleMessageEdited = (data) => {
            setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, content: data.content, isEdited: true } : m));
        };

        const handleMessageDeleted = (data) => {
            setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeleted: true, content: 'This message was deleted.' } : m));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('online_users', handleOnlineUsers);
        socket.on('conversation_update', handleConvUpdate);
        socket.on('user_typing', handleUserTyping);
        socket.on('user_stop_typing', handleUserStopTyping);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);

        socket.emit('user_online', user._id); // ensure we tell server we are here

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('online_users', handleOnlineUsers);
            socket.off('conversation_update', handleConvUpdate);
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stop_typing', handleUserStopTyping);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [user?._id, activeChat, scrollToBottom]);

    useEffect(() => { 
        fetchConversations(); 
        fetchUsers(); 
        
        // Handle redirect from Groups page
        if (location.state?.activeGroup) {
            const group = location.state.activeGroup;
            setActiveChat({
                conversationId: group._id, // Group ID is the conversation ID
                otherUser: { id: group._id, name: group.name, model: 'Group' },
                lastMessage: 'Squad Channel'
            });
            // Clear state so refresh doesn't trigger again
            window.history.replaceState({}, document.title)
        }
    }, [location.state?.activeGroup]);

    useEffect(() => {
        if (activeChat) {
            const convId = activeChat.conversationId || [user?._id, activeChat.otherUser.id].sort().join('_');
            if (prevConvRef.current && prevConvRef.current !== convId) {
                leaveConversation(prevConvRef.current);
            }
            if (prevConvRef.current !== convId) {
                joinConversation(convId);
                prevConvRef.current = convId;
            }
            fetchMessages(activeChat.otherUser.id);
            setReplyingTo(null);
            setEditingMessage(null);
            setNewMessage('');
            setIsMobileListOpen(false);
        }
    }, [activeChat, user?._id]);

    useEffect(() => {
        const handleClick = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false); };
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
            const [adminRes, empRes] = await Promise.all([api.get('/auth/admins'), api.get('/employees')]);
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

    const handleTyping = () => {
        if (!activeChat) return;
        const convId = prevConvRef.current;
        emitTyping(convId, user?._id, user?.username || user?.name);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(convId, user?._id);
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !activeChat || sending) return;
        setSending(true);
        try {
            let data;
            const payload = {
                receiverId: activeChat.otherUser.id,
                receiverModel: activeChat.otherUser.model,
                content: newMessage.trim(),
                messageType: 'text',
            };
            if (replyingTo) payload.replyToId = replyingTo._id;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                const res = await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                data = res.data;
                setSelectedFile(null);
            } else {
                const res = await api.post('/messages', payload);
                data = res.data;
            }

            setMessages(prev => [...prev, data]);
            setNewMessage('');
            setReplyingTo(null);

            const convId = data.conversationId || prevConvRef.current;
            emitMessage(convId, data);
            fetchConversations();
            setTimeout(scrollToBottom, 50);
        } catch (error) { toast.error('Message failed to send'); }
        finally { setSending(false); }
    };

    const handleSendGif = async (gifUrl) => {
        if (!activeChat || sending) return;
        setSending(true);
        setShowGifPicker(false);
        try {
            const payload = {
                receiverId: activeChat.otherUser.id,
                receiverModel: activeChat.otherUser.model,
                content: '',
                messageType: 'gif',
                gifUrl
            };
            if (replyingTo) payload.replyToId = replyingTo._id;

            const { data } = await api.post('/messages', payload);
            setMessages(prev => [...prev, data]);
            setReplyingTo(null);

            emitMessage(data.conversationId || prevConvRef.current, data);
            fetchConversations();
            setTimeout(scrollToBottom, 50);
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

    // ─── Reply & Edit Actions ───────────────────────────
    const handleStartReply = (msg) => {
        setReplyingTo(msg);
        setEditingMessage(null);
    };

    const handleStartEdit = (msg) => {
        setEditingMessage(msg);
        setEditContent(msg.content);
        setReplyingTo(null);
    };

    const handleSaveEdit = async () => {
        if (!editingMessage || !editContent.trim()) return;
        try {
            const { data } = await api.put(`/messages/${editingMessage._id}`, { content: editContent.trim() });
            setMessages(prev => prev.map(m => m._id === data._id ? data : m));
            setEditingMessage(null);
            setEditContent('');
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to edit message'); }
    };

    const handleDeleteMessage = async (msg) => {
        if (!window.confirm('Delete this message for everyone?')) return;
        try {
            await api.delete(`/messages/${msg._id}`);
            setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m));
            // socket emits internally via the delete controller
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete message'); }
    };

    // ─── Audio Recording ────────────────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/ogg;codecs=opus', 'audio/wav'];
            const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

            mediaRecorderRef.current = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

            mediaRecorderRef.current.onstop = async () => {
                const supportedMimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
                audioChunksRef.current = [];
                let extension = supportedMimeType.includes('mp4') ? 'mp4' : supportedMimeType.includes('ogg') ? 'ogg' : 'webm';
                const audioFile = new File([audioBlob], `voice-${Date.now()}.${extension}`, { type: supportedMimeType });

                setSending(true);
                const formData = new FormData();
                formData.append('file', audioFile);
                formData.append('receiverId', activeChat.otherUser.id);
                formData.append('receiverModel', activeChat.otherUser.model);
                if (replyingTo) formData.append('replyToId', replyingTo._id);

                try {
                    const { data } = await api.post('/messages/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    setMessages(prev => [...prev, data]);
                    setReplyingTo(null);
                    emitMessage(data.conversationId || prevConvRef.current, data);
                    fetchConversations();
                    setTimeout(scrollToBottom, 50);
                } catch { toast.error('Failed to send voice note'); }
                finally { setSending(false); }
                stream.getTracks().forEach(track => track.stop());
            };

            audioChunksRef.current = [];
            setRecordingTime(0);
            setIsRecording(true);
            mediaRecorderRef.current.start();
            recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch { toast.error('Microphone access denied.'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = () => {
                audioChunksRef.current = [];
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
            setRecordingTime(0);
        }
    };

    const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())), [users, searchQuery]);
    const isUserOnline = (userId) => onlineUsers.includes(userId?.toString());

    const getProfileAvatar = (chatUser) => {
        if (chatUser?.profilePhoto) {
            const src = chatUser.profilePhoto.startsWith('http') ? chatUser.profilePhoto : `${API_BASE}${chatUser.profilePhoto}`;
            return <img src={src} alt={chatUser.name} className="w-full h-full object-cover" />;
        }
        return <span className="text-primary-600 dark:text-primary-400 font-black text-lg">{chatUser?.name?.charAt(0)?.toUpperCase()}</span>;
    };

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
        <div className="h-[calc(100dvh-100px)] md:h-[calc(100vh-180px)] flex flex-col md:flex-row gap-3 md:gap-6">
            {/* ─── Conversation List ─────────────────────── */}
            <div className={cn("w-full md:w-80 xl:w-[26rem] flex flex-col bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-primary-500/5", !isMobileListOpen && "hidden md:flex")}>
                <div className="p-4 md:p-6 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Chats</h2>
                        <button onClick={() => { setShowAllUsers(!showAllUsers); setSearchQuery(''); }}
                            className={cn("p-2.5 rounded-xl transition-all shadow-sm", showAllUsers ? "bg-primary-500 text-white" : "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100")} title="New Chat">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input type="text" placeholder="Search people..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowAllUsers(true); }}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border-none rounded-[1.25rem] text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all dark:text-white outline-none" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide pb-6 pt-2">
                    {searchQuery || showAllUsers ? (
                        <div className="px-3 space-y-1">
                            {showAllUsers && !searchQuery && <p className="text-[10px] font-black text-gray-400 px-4 py-2 uppercase tracking-widest">Connect With</p>}
                            {filteredUsers.map(u => (
                                <button key={u.id} onClick={() => { setActiveChat({ otherUser: u }); setSearchQuery(''); }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[1.25rem] transition-all text-left">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-[1rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                            {getProfileAvatar(u)}
                                        </div>
                                        {isUserOnline(u.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black dark:text-white truncate">{u.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.role}</p>
                                    </div>
                                </button>
                            ))}
                            {filteredUsers.length === 0 && <p className="text-center text-xs font-medium text-gray-400 py-8">No users found</p>}
                        </div>
                    ) : (
                        <div className="px-3 space-y-1">
                            {conversations.map((conv) => (
                                <button key={conv.conversationId} onClick={() => setActiveChat(conv)}
                                    className={cn("w-full flex items-center gap-3 p-3 rounded-[1.25rem] transition-all text-left relative",
                                        activeChat?.conversationId === conv.conversationId ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    )}>
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-[1rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                            {getProfileAvatar(conv.otherUser)}
                                        </div>
                                        {isUserOnline(conv.otherUser.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-sm font-bold dark:text-white truncate">{conv.otherUser.name}</p>
                                            <span className="text-[10px] font-bold text-gray-400 shrink-0">{format(new Date(conv.updatedAt), 'HH:mm')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-xs truncate max-w-[85%]", !conv.isRead ? "font-black text-gray-900 dark:text-gray-100" : "text-gray-500 font-medium")}>
                                                {conv.lastMessage}
                                            </p>
                                            {!conv.isRead && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-sm" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {conversations.length === 0 && !loading && (
                                <div className="py-12 text-center opacity-50 flex flex-col items-center">
                                    <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                                    <p className="text-xs font-bold text-gray-500 pt-2">No messages yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Chat Area ─────────────────────────────── */}
            <div className={cn("flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl shadow-primary-500/5 relative", isMobileListOpen && "hidden md:flex")}>
                {activeChat ? (
                    <>
                        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shrink-0 z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setIsMobileListOpen(true); setShowEmojiPicker(false); setShowGifPicker(false); }} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <ArrowLeft className="w-5 h-5 dark:text-white" />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-[0.8rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                                        {getProfileAvatar(activeChat.otherUser)}
                                    </div>
                                    {isUserOnline(activeChat.otherUser.id) && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                                </div>
                                <div>
                                    <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white tracking-tight">{activeChat.otherUser.name}</h3>
                                    <div className="flex items-center gap-1.5 h-4">
                                        {typingUser ? (
                                            <span className="text-[11px] font-bold text-primary-500 italic animate-pulse">typing...</span>
                                        ) : (
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isUserOnline(activeChat.otherUser.id) ? "text-emerald-500" : "text-gray-400")}>
                                                {isUserOnline(activeChat.otherUser.id) ? 'Online' : 'Offline'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <button onClick={() => setShowChatOptions(!showChatOptions)} className="p-2 md:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {showChatOptions && (
                                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[160px] z-50">
                                        <button onClick={() => { setShowChatOptions(false); toast.info('Clear chat UI local mock'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <Trash2 className="w-4 h-4" /> Clear local screen
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 space-y-4 md:space-y-6 scrollbar-hide flex flex-col bg-gray-50/30 dark:bg-[#080b12] relative z-0">
                            {messages.length === 0 && <div className="flex-1 flex items-center justify-center text-center opacity-30"><MessageSquare className="w-12 h-12" /></div>}
                            {messageGroups.map((item, idx) => item.type === 'date'
                                ? <DateSeparator key={`date-${idx}`} date={item.date} />
                                : <MessageBubble key={item.data._id} msg={item.data} isMe={item.data.sender.id === user?._id} onEdit={handleStartEdit} onDelete={handleDeleteMessage} onReply={handleStartReply} />
                            )}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Action Bars (Edit / Reply) */}
                        {(editingMessage || replyingTo) && (
                            <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-md flex items-center gap-3 shrink-0 z-10">
                                {editingMessage ? <Pencil className="w-4 h-4 text-primary-500" /> : <Reply className="w-4 h-4 text-primary-500" />}
                                <div className="flex-1 min-w-0 border-l-[3px] border-primary-500 pl-3 py-0.5 line-clamp-2">
                                    <p className="text-xs font-black text-primary-600 dark:text-primary-400 capitalize">{editingMessage ? 'Editing message' : `Replying to ${replyingTo.sender.name}`}</p>
                                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{editingMessage ? editingMessage.content : (replyingTo.content || 'Attachment/Media')}</p>
                                </div>
                                <button onClick={() => { setEditingMessage(null); setReplyingTo(null); setEditContent(''); }} className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 md:p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-20">
                            {selectedFile && <div className="mb-3"><FilePreview file={selectedFile} onRemove={() => setSelectedFile(null)} /></div>}

                            <div className="relative">
                                {showEmojiPicker && (
                                    <div ref={emojiRef} className="absolute bottom-[calc(100%+10px)] left-0 z-50">
                                        <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={350} theme="auto" previewConfig={{ showPreview: false }} />
                                    </div>
                                )}
                                {showGifPicker && <GifPicker onSelect={handleSendGif} onClose={() => setShowGifPicker(false)} />}

                                {editingMessage ? (
                                    <div className="flex items-center gap-2">
                                        <input value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }} autoFocus
                                            className="flex-1 bg-gray-50 dark:bg-gray-800 px-4 py-3 md:py-3.5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none dark:text-white" />
                                        <button onClick={handleSaveEdit} className="p-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-500 transition-colors shadow-lg"><Check className="w-5 h-5" /></button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end relative">
                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.mp4,.mp3,.wav" />

                                        {isRecording ? (
                                            <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-2xl md:rounded-[1.5rem] px-4 py-3 md:py-3.5 border border-red-200 dark:border-red-800 shadow-inner">
                                                <div className="flex items-center gap-3 text-red-500 font-bold animate-pulse">
                                                    <Mic className="w-5 h-5" /> Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                                </div>
                                                <button type="button" onClick={cancelRecording} className="text-red-500 hover:underline text-xs font-bold">Cancel</button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex bg-gray-50 dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl md:rounded-[1.5rem] shadow-sm items-end focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500/50 transition-all p-1">
                                                <div className="flex items-center py-2 px-1">
                                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-primary-500 transition" title="Attach file"><Paperclip className="w-5 h-5" /></button>
                                                    <button type="button" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className="hidden sm:block p-2 text-gray-400 hover:text-primary-500 transition" title="Send GIF"><Film className="w-5 h-5" /></button>
                                                    <button type="button" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className="p-2 text-gray-400 hover:text-amber-500 transition"><Smile className="w-5 h-5" /></button>
                                                </div>
                                                <textarea rows={1} placeholder={selectedFile ? "Caption..." : "Type a message..."}
                                                    value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                                                    style={{ minHeight: '44px', maxHeight: '120px' }}
                                                    className="w-full bg-transparent border-none text-sm font-semibold dark:text-white outline-none resize-none px-2 py-3 leading-relaxed placeholder:text-gray-400"
                                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} />
                                            </div>
                                        )}

                                        {isRecording ? (
                                            <button type="button" onClick={stopRecording} className="p-3.5 bg-red-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none flex-shrink-0 animate-pulse shadow-lg shadow-red-500/30 mb-0.5">
                                                <Square className="w-5 h-5 fill-current" />
                                            </button>
                                        ) : (
                                            <button type={newMessage.trim() || selectedFile ? 'submit' : 'button'} onClick={(!newMessage.trim() && !selectedFile) ? startRecording : undefined} disabled={sending}
                                                className={cn("p-3.5 md:p-4 text-white rounded-2xl md:rounded-[1.5rem] disabled:opacity-50 hover:scale-105 active:scale-95 transition-all outline-none flex-shrink-0 mb-0.5 shadow-lg",
                                                    (newMessage.trim() || selectedFile) ? "bg-primary-600 shadow-primary-500/30" : "bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 shadow-gray-900/20"
                                                )}>
                                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : (newMessage.trim() || selectedFile ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />)}
                                            </button>
                                        )}
                                    </form>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="w-24 h-24 bg-primary-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary-500/10">
                            <MessageSquare className="w-10 h-10 text-primary-500 dark:text-gray-400" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Team Chat</h3>
                        <p className="text-sm font-medium text-gray-500 max-w-xs">Select a conversation from the sidebar or search for someone to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
