import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';

// Route imports
import instituteAuthRoutes from './routes/auth/institute.js';
import studentAuthRoutes from './routes/auth/student.js'; // ✅ MAKE SURE THIS IS HERE
import instituteManagementRoutes from './routes/institute/studentManagement.js';
import courseManagementRoutes from './routes/institute/courseManagement.js'; // ✅ NEW IMPORT

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

// Institute management routes
app.use(`${apiPrefix}/institute`, instituteManagementRoutes);
app.use(`${apiPrefix}/institute`, courseManagementRoutes); // ✅ NEW COURSE ROUTES

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Management Platform API is running!',
    timestamp: new Date().toISOString(),
    environment: config.server.environment
  });
});

// Root endpoint with enhanced API documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Student Management Platform API',
    version: '1.0.0',
    features: [
      'Student Management System',
      'Course & Subject Management', // ✅ NEW FEATURE
      'Multi-tenant Architecture',
      'Bulk Operations',
      'Real-time Data Sync'
    ],
    endpoints: {
      authentication: {
        institute: `${apiPrefix}/auth/institute/`,
        student: `${apiPrefix}/auth/student/`
      },
      management: {
        students: `${apiPrefix}/institute/students`,
        courses: `${apiPrefix}/institute/courses`, // ✅ NEW ENDPOINT
        dashboard: `${apiPrefix}/institute/dashboard-stats`
      },
      documentation: '/api/v1/docs'
    }
  });
});

// ✅ ENHANCED: API endpoints listing for debugging
app.get('/api/v1/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Available API Routes',
    routes: {
      // Authentication Routes
      'Institute Auth': {
        'POST /auth/institute/register': 'Register new institute',
        'POST /auth/institute/login': 'Institute admin login',
        'GET /auth/institute/profile': 'Get institute profile'
      },
      'Student Auth': {
        'POST /auth/student/register': 'Student registration',
        'POST /auth/student/login': 'Student login',
        'GET /auth/student/profile': 'Get student profile'
      },
      
      // Management Routes
      'Student Management': {
        'GET /institute/students': 'List students with filtering',
        'PUT /institute/students/:id/verify': 'Verify/unverify student',
        'PUT /institute/students/bulk-update': 'Bulk operations on students',
        'GET /institute/students/export': 'Export student data',
        'GET /institute/dashboard-stats': 'Dashboard statistics'
      },
      
      // ✅ NEW: Course Management Routes
      'Course Management': {
        'GET /institute/courses': 'List courses with filtering',
        'POST /institute/courses': 'Create new course',
        'GET /institute/courses/:id': 'Get course details',
        'PUT /institute/courses/:id': 'Update course',
        'DELETE /institute/courses/:id': 'Delete course',
        'PUT /institute/courses/bulk-update': 'Bulk operations on courses',
        'POST /institute/courses/sync-enrollments': 'Sync enrollment counts'
      }
    }
  });
});

// 404 handler (MUST be before error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: '/api/v1/routes' // ✅ Helpful reference
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
