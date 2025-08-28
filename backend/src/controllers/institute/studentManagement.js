import Student from '../../models/Student.js';
import Institute from '../../models/Institute.js';

/**
 * Enhanced Student List with Advanced Filtering, Sorting, and Statistics
 */
export const getInstituteStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const course = req.query.course || '';
    const semester = req.query.semester || '';
    const admissionYear = req.query.admissionYear || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const instituteId = req.user.instituteId;

    // Build dynamic query
    const query = { institute: instituteId };
    
    // Advanced search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filtering
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (status === 'active') query.academicStatus = 'Active';
    if (status === 'inactive') query.academicStatus = 'Inactive';

    // Course and academic filters
    if (course) query.course = { $regex: course, $options: 'i' };
    if (semester) query.currentSemester = parseInt(semester);
    if (admissionYear) query.admissionYear = parseInt(admissionYear);

    console.log('🔍 Query:', query);
    console.log('🔄 Sort:', { [sortBy]: sortOrder });

    // Execute query with pagination and sorting
    const students = await Student.find(query)
      .select('-password')
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('institute', 'instituteName instituteCode');

    const total = await Student.countDocuments(query);

    // Get filter statistics for UI
    const stats = await getFilterStats(instituteId);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
          hasMore: page < Math.ceil(total / limit)
        },
        filters: stats,
        query: { search, status, course, semester, admissionYear, sortBy, sortOrder }
      }
    });

    console.log(`✅ Fetched ${students.length}/${total} students for institute ${instituteId}`);

  } catch (error) {
    console.error('Error fetching students:', error);
    next(error);
  }
};

/**
 * Get Filter Statistics for Dynamic UI Components
 */
const getFilterStats = async (instituteId) => {
  try {
    const [courses, semesters, admissionYears, statusCounts] = await Promise.all([
      // Get all unique courses
      Student.distinct('course', { institute: instituteId }),
      
      // Get all unique semesters
      Student.distinct('currentSemester', { institute: instituteId }),
      
      // Get all unique admission years
      Student.distinct('admissionYear', { institute: instituteId }),
      
      // Get status counts with aggregation
      Student.aggregate([
        { $match: { institute: instituteId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
            unverified: { $sum: { $cond: ['$isVerified', 0, 1] } },
            active: { $sum: { $cond: [{ $eq: ['$academicStatus', 'Active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$academicStatus', 'Inactive'] }, 1, 0] } }
          }
        }
      ])
    ]);

    return {
      availableCourses: courses.filter(Boolean).sort(),
      availableSemesters: semesters.filter(Boolean).sort((a, b) => a - b),
      availableYears: admissionYears.filter(Boolean).sort((a, b) => b - a),
      statusCounts: statusCounts[0] || {
        total: 0, verified: 0, unverified: 0, active: 0, inactive: 0
      }
    };
  } catch (error) {
    console.error('Filter stats error:', error);
    return { 
      availableCourses: [], 
      availableSemesters: [], 
      availableYears: [], 
      statusCounts: { total: 0, verified: 0, unverified: 0, active: 0, inactive: 0 } 
    };
  }
};

/**
 * Bulk Update Students (Enhanced with multiple actions)
 */
export const bulkUpdateStudents = async (req, res, next) => {
  try {
    const { studentIds, action, value } = req.body;
    const instituteId = req.user.instituteId;
    
    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid student IDs'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an action to perform'
      });
    }
    
    console.log(`🔄 Bulk ${action} requested for ${studentIds.length} students`);
    
    // Validate students belong to institute
    const students = await Student.find({
      _id: { $in: studentIds },
      institute: instituteId
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found or do not belong to your institute'
      });
    }

    let updateQuery = {};
    let actionMessage = '';

    // Define bulk update actions
    switch (action) {
      case 'verify':
        updateQuery = { isVerified: true };
        actionMessage = 'verified';
        break;
      case 'unverify':
        updateQuery = { isVerified: false };
        actionMessage = 'unverified';
        break;
      case 'activate':
        updateQuery = { academicStatus: 'Active' };
        actionMessage = 'activated';
        break;
      case 'deactivate':
        updateQuery = { academicStatus: 'Inactive' };
        actionMessage = 'deactivated';
        break;
      case 'update_semester':
        if (!value || isNaN(parseInt(value))) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid semester number'
          });
        }
        updateQuery = { currentSemester: parseInt(value) };
        actionMessage = `semester updated to ${value}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Supported actions: verify, unverify, activate, deactivate, update_semester'
        });
    }

    // Perform bulk update
    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: updateQuery }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} students ${actionMessage} successfully`,
      data: {
        studentsAffected: result.modifiedCount,
        action,
        value,
        timestamp: new Date()
      }
    });

    console.log(`✅ Bulk ${action}: ${result.modifiedCount} students ${actionMessage}`);

  } catch (error) {
    console.error('Bulk update error:', error);
    next(error);
  }
};

/**
 * Export Student Data (CSV and JSON formats)
 */
export const exportStudentData = async (req, res, next) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    const instituteId = req.user.instituteId;

    // Build query from filters (similar to getInstituteStudents)
    const query = { institute: instituteId };
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { rollNumber: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.status === 'verified') query.isVerified = true;
    if (filters.status === 'unverified') query.isVerified = false;
    if (filters.status === 'active') query.academicStatus = 'Active';
    if (filters.status === 'inactive') query.academicStatus = 'Inactive';

    if (filters.course) query.course = { $regex: filters.course, $options: 'i' };
    if (filters.semester) query.currentSemester = parseInt(filters.semester);
    if (filters.admissionYear) query.admissionYear = parseInt(filters.admissionYear);

    const students = await Student.find(query)
      .select('-password')
      .populate('institute', 'instituteName')
      .sort({ rollNumber: 1 });

    if (format === 'csv') {
      const csv = generateCSV(students);
      const fileName = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(csv);
    }

    // Return JSON format
    res.json({
      success: true,
      data: students,
      exportedAt: new Date(),
      count: students.length,
      filters: filters
    });

    console.log(`✅ Exported ${students.length} students as ${format.toUpperCase()}`);

  } catch (error) {
    console.error('Export error:', error);
    next(error);
  }
};

/**
 * Generate CSV content from student data
 */
const generateCSV = (students) => {
  const headers = [
    'Roll Number',
    'Name', 
    'Email',
    'Phone',
    'Course',
    'Semester',
    'Admission Year',
    'Academic Status',
    'Verification Status',
    'Registration Date'
  ];
  
  const rows = students.map(student => [
    student.rollNumber,
    student.name,
    student.email,
    student.phone || '',
    student.course,
    student.currentSemester,
    student.admissionYear,
    student.academicStatus,
    student.isVerified ? 'Verified' : 'Pending',
    student.createdAt.toISOString().split('T')[0] // Date only
  ]);

  return [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
};

/**
 * Verify/Unverify single student (existing function - enhanced)
 */
export const updateStudentVerification = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { isVerified } = req.body;
    const instituteId = req.user.instituteId;

    const student = await Student.findOne({
      _id: studentId,
      institute: instituteId
    });

    if (!student) {
      const error = new Error('Student not found.');
      error.status = 404;
      throw error;
    }

    const previousStatus = student.isVerified;
    student.isVerified = isVerified;
    await student.save();

    res.json({
      success: true,
      message: `Student ${isVerified ? 'verified' : 'unverified'} successfully.`,
      data: {
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        isVerified: student.isVerified,
        previousStatus,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Student ${student.name} (${student.rollNumber}) ${isVerified ? 'verified' : 'unverified'} by admin`);

  } catch (error) {
    console.error('Error updating student verification:', error);
    next(error);
  }
};

/**
 * Get institute dashboard stats (enhanced with more metrics)
 */
export const getInstituteDashboardStats = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;

    const [totalStudents, verifiedStudents, unverifiedStudents, recentRegistrations, courseStats] = await Promise.all([
      Student.countDocuments({ institute: instituteId }),
      Student.countDocuments({ institute: instituteId, isVerified: true }),
      Student.countDocuments({ institute: instituteId, isVerified: false }),
      Student.countDocuments({
        institute: instituteId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      // Course-wise statistics
      Student.aggregate([
        { $match: { institute: instituteId } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        verifiedStudents,
        unverifiedStudents,
        recentRegistrations,
        verificationRate: totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0,
        topCourses: courseStats,
        lastUpdated: new Date()
      }
    });

    console.log(`✅ Dashboard stats loaded for institute ${instituteId}`);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};
