import express from 'express';
import { registerStudent, loginStudent, getStudentProfile } from '../../controllers/auth/studentAuth.js';
import { verifyStudentToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Student Authentication Routes
 */

// POST /api/v1/auth/student/register
// Register a new student
router.post('/register', registerStudent);

// POST /api/v1/auth/student/login  
// Student login
router.post('/login', loginStudent);

// GET /api/v1/auth/student/profile
// Get current student profile (protected route)
router.get('/profile', verifyStudentToken, getStudentProfile);

export default router;
