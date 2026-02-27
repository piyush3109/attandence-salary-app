const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seedData = require('./utils/seeder');

// Load environment variables
dotenv.config();

// Connect to Database and Seed
connectDB().then(() => {
    seedData();
});

const app = express();
const server = http.createServer(app);

// Socket.IO setup for real-time messaging
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Track online users: { odoo: socketId }
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
    });

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
        socket.leave(conversationId);
    });

    // New message sent - broadcast to conversation
    socket.on('send_message', (data) => {
        const { conversationId, message } = data;
        // Broadcast to everyone in the conversation except sender
        socket.to(conversationId).emit('new_message', message);
        // Also notify for conversation list update
        io.emit('conversation_update', { conversationId });
    });

    // Typing indicator
    socket.on('typing', (data) => {
        socket.to(data.conversationId).emit('user_typing', {
            userId: data.userId,
            name: data.name
        });
    });

    socket.on('stop_typing', (data) => {
        socket.to(data.conversationId).emit('user_stop_typing', {
            userId: data.userId
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        // Remove user from online list
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                break;
            }
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
    });
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache headers for static assets (performance boost)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
    lastModified: true
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/advance', require('./routes/advanceRoutes'));
app.use('/api/salary', require('./routes/salaryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/lifecycle', require('./routes/lifecycleRoutes'));
app.use('/api/trainings', require('./routes/trainingRoutes'));
app.use('/api/field', require('./routes/fieldRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

const { loadPlugins } = require('./utils/pluginLoader');
loadPlugins(app);

// Root Route
app.get('/', (req, res) => {
    res.send('Attendance and Salary Management API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

// Prevent server crashes from unhandled errors (e.g., nodemailer stream errors)
process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`⚡ WebSocket ready for real-time messaging`);
});
