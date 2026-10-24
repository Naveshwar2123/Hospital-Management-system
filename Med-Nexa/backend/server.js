require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const setupSocket = require('./src/socket/socketHandler');
const seedDoctors = require('./src/utils/seedData');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const consultationRoutes = require('./src/routes/consultationRoutes');
// ==============================================================================
// GOOGLE SHEETS ROUTES (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
// ------------------------------------------------------------------------------
// Demonstrates REST API interfacing with Google Apps Script as a cloud database engine.
// Kept in codebase for academic review and student presentation.
// const sheetsRoutes = require('./src/routes/sheetsRoutes');
// ==============================================================================

// Supabase PostgreSQL routes & connection
const supabaseRoutes = require('./src/routes/supabaseRoutes');
const { connectSupabase } = require('./src/config/supabase');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Setup socket handlers
setupSocket(io);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting (generous in development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { success: false, message: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/consultations', consultationRoutes);
// ==============================================================================
// GOOGLE SHEETS MOUNT (COMMENTED - PRESERVED FOR TEACHER EXPLANATION)
// app.use('/api/sheets', sheetsRoutes);
// ==============================================================================

// Supabase PostgreSQL API
app.use('/api/supabase', supabaseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Med-Nexa API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedDoctors();

  server.listen(PORT, () => {
    console.log(`\n🌿 ═══════════════════════════════════════════`);
    console.log(`   Med-Nexa Health Platform Running`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Client URL: ${process.env.CLIENT_URL}`);
    console.log(`🌿 ═══════════════════════════════════════════\n`);
  });
};

startServer();
