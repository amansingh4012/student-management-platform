import express from 'express';
import { 
  getInstituteStudents, 
  updateStudentVerification,
  getInstituteDashboardStats,
  bulkUpdateStudents,        // ✅ NEW IMPORT
  exportStudentData          // ✅ NEW IMPORT
} from '../../controllers/institute/studentManagement.js';
import { verifyToken } from '../../middleware/auth.js';

const router = express.Router();

// All routes require institute authentication
router.use(verifyToken);

/**
 * ========================================
 * STUDENT MANAGEMENT ROUTES
 * ========================================
 */

/**
 * GET /api/v1/institute/students 
 * Enhanced student list with advanced filtering, sorting, and pagination
 * Query params: 
 *   - page, limit (pagination)
 *   - search (multi-field search)
 *   - status (verified/unverified/active/inactive)
 *   - course, semester, admissionYear (filters)
 *   - sortBy, sortOrder (sorting)
 */
router.get('/students', getInstituteStudents);

/**
 * PUT /api/v1/institute/students/:studentId/verify
 * Verify or unverify a single student
 * Body: { isVerified: true/false }
 */
router.put('/students/:studentId/verify', updateStudentVerification);

/**
 * ✅ NEW: PUT /api/v1/institute/students/bulk-update
 * Bulk operations on multiple students
 * Body: { 
 *   studentIds: string[], 
 *   action: 'verify'|'unverify'|'activate'|'deactivate'|'update_semester', 
 *   value?: number (for update_semester)
 * }
 */
router.put('/students/bulk-update', bulkUpdateStudents);

/**
 * ✅ NEW: GET /api/v1/institute/students/export
 * Export student data in CSV or JSON format
 * Query params: 
 *   - format: 'csv' | 'json' (default: csv)
 *   - All filter params from getInstituteStudents
 */
router.get('/students/export', exportStudentData);

/**
 * ========================================
 * DASHBOARD & STATISTICS ROUTES
 * ========================================
 */

/**
 * GET /api/v1/institute/dashboard-stats
 * Get comprehensive dashboard statistics
 * Returns: student counts, verification rates, course statistics, recent registrations
 */
router.get('/dashboard-stats', getInstituteDashboardStats);

export default router;
