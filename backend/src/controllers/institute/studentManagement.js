import Student from '../../models/Student.js';
import Institute from '../../models/Institute.js';

/**
 * Get all students for institute with pagination and search
 */
export const getInstituteStudents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const instituteId = req.user.instituteId; // From JWT token

    // Build query
    const query = { institute: instituteId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status === 'verified') query.isVerified = true;
      if (status === 'unverified') query.isVerified = false;
    }

    // Execute query with pagination
    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
          hasMore: page < Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    next(error);
  }
};

/**
 * Verify/Unverify student
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

    student.isVerified = isVerified;
    await student.save();

    res.json({
      success: true,
      message: `Student ${isVerified ? 'verified' : 'unverified'} successfully.`,
      data: {
        studentId: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        isVerified: student.isVerified
      }
    });

    console.log(`✅ Student ${student.name} (${student.rollNumber}) ${isVerified ? 'verified' : 'unverified'} by admin`);

  } catch (error) {
    console.error('Error updating student verification:', error);
    next(error);
  }
};


/**
 * Get institute dashboard stats
 */
export const getInstituteDashboardStats = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;

    const totalStudents = await Student.countDocuments({ institute: instituteId });
    const verifiedStudents = await Student.countDocuments({ institute: instituteId, isVerified: true });
    const unverifiedStudents = await Student.countDocuments({ institute: instituteId, isVerified: false });
    const recentRegistrations = await Student.countDocuments({
      institute: instituteId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        verifiedStudents,
        unverifiedStudents,
        recentRegistrations,
        verificationRate: totalStudents > 0 ? Math.round((verifiedStudents / totalStudents) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    next(error);
  }
};
