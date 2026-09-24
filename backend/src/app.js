require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ========================
// MIDDLEWARE
// ========================
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] ${req.method} ${req.path}`);
    next();
  });
}

// ========================
// ROUTES
// ========================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/students', require('./routes/students'));
app.use('/api/dat', require('./routes/dat'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/graduation', require('./routes/graduation'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server đang hoạt động bình thường 🚗',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// Global error handler
app.use(errorHandler);

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000;

async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log('');
    console.log('🚗 ========================================');
    console.log('   HỆ THỐNG ĐÀO TẠO LÁI XE - BACKEND API');
    console.log('🚗 ========================================');
    console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log('');
  });
}

startServer().catch(err => {
  console.error('❌ Lỗi khởi động server:', err);
  process.exit(1);
});

module.exports = app;
