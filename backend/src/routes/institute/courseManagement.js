import express from 'express';
import { 
  getInstituteCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  bulkUpdateCourses,
  syncCourseEnrollments,
  // ✅ NEW: Semester assignment functions
  getSemesterAssignments,
  validateSemesterAssignment
} from '../../controllers/institute/courseManagement.js';
import { verifyToken } from '../../middleware/auth.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// All routes require institute authentication
router.use(verifyToken);

// ✅ NEW: Validation middleware for checking validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {})
    });
  }
  next();
};

/**
 * ========================================
 * COURSE MANAGEMENT ROUTES
 * ========================================
 */

/**
 * GET /api/v1/institute/courses
 * Get all courses with advanced filtering, pagination, and sorting
 * Query params: 
 *   - page, limit (pagination)
 *   - search (multi-field search)
 *   - department, degreeType, status, academicYear (filters)
 *   - assignedDepartment, assignedSemester (semester assignment filters) ✅ NEW
 *   - sortBy, sortOrder (sorting)
 */
router.get('/courses', getInstituteCourses);

/**
 * POST /api/v1/institute/courses
 * Create a new course with semester assignment validation
 * Body: {
 *   courseName: string,
 *   courseCode: string,
 *   description?: string,
 *   duration: number,
 *   totalSemesters: number,
 *   department: string,
 *   degreeType: 'Undergraduate'|'Postgraduate'|'Diploma'|'Certificate',
 *   academicYear: string,
 *   maxStudents?: number,
 *   assignedDepartment: string, ✅ NEW
 *   assignedSemester: number (1-8), ✅ NEW
 *   semesterCredits: number (1-8) ✅ NEW
 * }
 */
router.post('/courses', [
  // ✅ NEW: Enhanced validation with semester assignment
  body('courseName')
    .trim()
    .notEmpty()
    .withMessage('Course name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Course name must be between 3 and 100 characters'),
  
  body('courseCode')
    .trim()
    .notEmpty()
    .withMessage('Course code is required')
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must contain only uppercase letters and numbers'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  
  body('degreeType')
    .isIn(['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'])
    .withMessage('Invalid degree type'),
  
  body('duration')
    .isInt({ min: 1, max: 12 })
    .withMessage('Duration must be between 1 and 12 semesters'),
  
  body('totalSemesters')
    .isInt({ min: 1, max: 12 })
    .withMessage('Total semesters must be between 1 and 12'),
  
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required'),
  
  // ✅ NEW: Semester assignment validations
  body('assignedDepartment')
    .trim()
    .notEmpty()
    .withMessage('Assigned department is required (which department will teach this course)'),
  
  body('assignedSemester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Assigned semester must be between 1 and 8'),
  
  body('semesterCredits')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester credits must be between 1 and 8'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max students must be 0 or greater (0 = unlimited)'),
  
  handleValidationErrors
], createCourse);

/**
 * GET /api/v1/institute/courses/:courseId
 * Get single course with detailed information including subjects and semester assignment
 * Returns: course info, subjects grouped by semester, enrollment count, semester assignment details
 */
router.get('/courses/:courseId', [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  handleValidationErrors
], getCourseById);

/**
 * PUT /api/v1/institute/courses/:courseId
 * Update course information with semester assignment validation
 * Body: Partial course object with fields to update (including semester assignment)
 */
router.put('/courses/:courseId', [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  
  // ✅ NEW: Optional validations for updates (only validate if provided)
  body('courseName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course name must be between 3 and 100 characters'),
  
  body('courseCode')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must contain only uppercase letters and numbers'),
  
  body('assignedDepartment')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assigned department cannot be empty'),
  
  body('assignedSemester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Assigned semester must be between 1 and 8'),
  
  body('semesterCredits')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester credits must be between 1 and 8'),
  
  body('degreeType')
    .optional()
    .isIn(['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'])
    .withMessage('Invalid degree type'),
  
  body('duration')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Duration must be between 1 and 12 semesters'),
  
  body('totalSemesters')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Total semesters must be between 1 and 12'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max students must be 0 or greater'),
  
  handleValidationErrors
], updateCourse);

/**
 * DELETE /api/v1/institute/courses/:courseId
 * Delete a course (only if no subjects or enrolled students)
 */
router.delete('/courses/:courseId', [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  handleValidationErrors
], deleteCourse);

/**
 * ========================================
 * SEMESTER ASSIGNMENT ROUTES ✅ NEW
 * ========================================
 */

/**
 * GET /api/v1/institute/courses/semester-assignments
 * Get overview of all semester assignments
 * Returns: Grouped view of courses by department and semester
 */
router.get('/courses/semester-assignments', getSemesterAssignments);

/**
 * POST /api/v1/institute/courses/validate-assignment
 * Validate if a semester assignment is available
 * Body: {
 *   assignedDepartment: string,
 *   assignedSemester: number,
 *   excludeCourseId?: string (for updates)
 * }
 */
router.post('/courses/validate-assignment', [
  body('assignedDepartment')
    .trim()
    .notEmpty()
    .withMessage('Assigned department is required'),
  
  body('assignedSemester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Assigned semester must be between 1 and 8'),
  
  body('excludeCourseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid course ID format for exclusion'),
  
  handleValidationErrors
], validateSemesterAssignment);

/**
 * ========================================
 * BULK OPERATIONS ROUTES
 * ========================================
 */

/**
 * PUT /api/v1/institute/courses/bulk-update
 * Bulk operations on multiple courses
 * Body: {
 *   courseIds: string[],
 *   action: 'activate'|'deactivate'|'update_academic_year'|'update_assigned_department'|'update_semester_credits', ✅ NEW actions
 *   value?: string|number (for specific actions)
 * }
 */
router.put('/courses/bulk-update', [
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage('Course IDs array is required with at least one ID'),
  
  body('courseIds.*')
    .isMongoId()
    .withMessage('All course IDs must be valid MongoDB ObjectIds'),
  
  body('action')
    .isIn(['activate', 'deactivate', 'update_academic_year', 'update_assigned_department', 'update_semester_credits'])
    .withMessage('Invalid bulk action'),
  
  body('value')
    .optional()
    .custom((value, { req }) => {
      const action = req.body.action;
      if (['update_academic_year', 'update_assigned_department'].includes(action)) {
        if (!value || typeof value !== 'string') {
          throw new Error('Value must be a non-empty string for this action');
        }
      }
      if (action === 'update_semester_credits') {
        if (!Number.isInteger(value) || value < 1 || value > 8) {
          throw new Error('Value must be an integer between 1 and 8 for semester credits');
        }
      }
      return true;
    }),
  
  handleValidationErrors
], bulkUpdateCourses);

/**
 * POST /api/v1/institute/courses/sync-enrollments
 * Sync enrollment counts for all courses
 * Updates currentEnrollment field based on actual student counts
 */
router.post('/courses/sync-enrollments', syncCourseEnrollments);

export default router;
