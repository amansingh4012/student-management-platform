import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';


// Route imports
import instituteAuthRoutes from './routes/auth/institute.js';
import studentAuthRoutes from './routes/auth/student.js'; // ✅ MAKE SURE THIS IS HERE
import instituteManagementRoutes from './routes/institute/studentManagement.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000
});
app.use(limiter);

// API Routes
const apiPrefix = config.api.prefix;

// Authentication routes
app.use(`${apiPrefix}/auth/institute`, instituteAuthRoutes);
app.use(`${apiPrefix}/auth/student`, studentAuthRoutes);    // ✅ MAKE SURE THIS IS HERE
app.use(`${apiPrefix}/institute`, instituteManagementRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Management Platform API is running!',
    timestamp: new Date().toISOString(),
    environment: config.server.environment
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Student Management Platform API',
    version: '1.0.0',
    documentation: '/api/v1/docs'
  });
});

// 404 handler (MUST be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handling middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled Error:', err);
  console.error('🚨 Error Stack:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
}); 

export default app;
