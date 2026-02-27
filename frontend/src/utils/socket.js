import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 10000
        });
    }
    return socket;
};

export const connectSocket = (userId) => {
    const s = getSocket();
    if (s.disconnected) {
        s.connect();
    }
    s.emit('user_online', userId);
    return s;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinConversation = (conversationId) => {
    const s = getSocket();
    s.emit('join_conversation', conversationId);
};

export const leaveConversation = (conversationId) => {
    const s = getSocket();
    s.emit('leave_conversation', conversationId);
};

export const emitMessage = (conversationId, message) => {
    const s = getSocket();
    s.emit('send_message', { conversationId, message });
};

export const emitTyping = (conversationId, userId, name) => {
    const s = getSocket();
    s.emit('typing', { conversationId, userId, name });
};

export const emitStopTyping = (conversationId, userId) => {
    const s = getSocket();
    s.emit('stop_typing', { conversationId, userId });
};

export default getSocket;
