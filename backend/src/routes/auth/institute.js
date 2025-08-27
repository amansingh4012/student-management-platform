import express from 'express';
import { registerInstitute, loginInstitute, getInstituteProfile } from '../../controllers/auth/instituteAuth.js';
import { verifyToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Institute Authentication Routes
 * Handles registration, login, and profile management for institutes
 */

// POST /api/v1/auth/institute/register
// Register a new institute
router.post('/register', registerInstitute);

// POST /api/v1/auth/institute/login  
// Institute admin login
router.post('/login', loginInstitute);

// GET /api/v1/auth/institute/profile
// Get current institute profile (protected route)
router.get('/profile', verifyToken, getInstituteProfile);

export default router;
