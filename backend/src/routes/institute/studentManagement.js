import express from 'express';
import { 
  getInstituteStudents, 
  updateStudentVerification,
  getInstituteDashboardStats  // Add this import

} from '../../controllers/institute/studentManagement.js';
import { verifyToken } from '../../middleware/auth.js';


const router = express.Router();

// All routes require institute authentication
router.use(verifyToken);

/**
 * GET /api/v1/institute/students 
 * Get paginated list of students with search and filter
 * Query params: page, limit, search, status
 */
router.get('/students', getInstituteStudents);
router.get('/dashboard-stats', getInstituteDashboardStats);

/**
 * PUT /api/v1/institute/students/:studentId/verify
 * Verify or unverify a student
 * Body: { isVerified: true/false }
 */
router.put('/students/:studentId/verify', updateStudentVerification);

export default router;
