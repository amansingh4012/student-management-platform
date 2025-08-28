import Course from '../../models/Course.js';
import Subject from '../../models/Subject.js';
import Student from '../../models/Student.js';

/**
 * Get all courses for institute with advanced filtering including semester assignments
 */
export const getInstituteCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const department = req.query.department || '';
    const degreeType = req.query.degreeType || '';
    const status = req.query.status || '';
    const academicYear = req.query.academicYear || '';
    // ✅ NEW: Semester assignment filters
    const assignedDepartment = req.query.assignedDepartment || '';
    const assignedSemester = req.query.assignedSemester || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const instituteId = req.user.instituteId;

    // Build dynamic query
    const query = { institute: instituteId };

    // Apply filters
    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { assignedDepartment: { $regex: search, $options: 'i' } } // ✅ NEW
      ];
    }

    if (department) query.department = { $regex: department, $options: 'i' };
    if (degreeType) query.degreeType = degreeType;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;
    // ✅ NEW: Semester assignment filters
    if (assignedDepartment) query.assignedDepartment = { $regex: assignedDepartment, $options: 'i' };
    if (assignedSemester) query.assignedSemester = parseInt(assignedSemester);

    // Execute query with population
    const courses = await Course.find(query)
      .populate('institute', 'instituteName instituteCode')
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Course.countDocuments(query);

    // Get statistics for filters including semester assignments
    const stats = await getCourseStats(instituteId);

    // Add subject count for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const subjectCount = await Subject.countDocuments({ course: course._id });
        return {
          ...course,
          subjectCount,
          enrollmentStatus: course.maxStudents === 0 ? 'Open' : 
            course.currentEnrollment >= course.maxStudents ? 'Full' : 'Available',
          // ✅ NEW: Add semester assignment display info
          semesterAssignmentDisplay: `${course.assignedDepartment} - Semester ${course.assignedSemester}`,
          totalCredits: course.semesterCredits
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: coursesWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasMore: page < Math.ceil(total / limit)
        },
        filters: stats,
        query: { 
          search, department, degreeType, status, academicYear, 
          assignedDepartment, assignedSemester, sortBy, sortOrder 
        }
      }
    });

    console.log(`✅ Fetched ${courses.length}/${total} courses for institute ${instituteId}`);

  } catch (error) {
    console.error('Error fetching courses:', error);
    next(error);
  }
};

/**
 * Create new course with semester assignment validation
 */
export const createCourse = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;

    const courseData = {
      ...req.body,
      institute: instituteId,
      createdBy: req.user.adminId
    };

    // ✅ ENHANCED: Check course code uniqueness
    const existingCourseCode = await Course.findOne({
      institute: instituteId,
      courseCode: courseData.courseCode.toUpperCase()
    });

    if (existingCourseCode) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists in your institute',
        errors: { courseCode: 'This course code is already in use' }
      });
    }

    // ✅ NEW: Check semester assignment uniqueness
    const existingSemesterAssignment = await Course.findOne({
      institute: instituteId,
      assignedDepartment: courseData.assignedDepartment,
      assignedSemester: courseData.assignedSemester
    });

    if (existingSemesterAssignment) {
      return res.status(400).json({
        success: false,
        message: `Another course "${existingSemesterAssignment.courseName}" is already assigned to ${courseData.assignedDepartment} in Semester ${courseData.assignedSemester}`,
        errors: { 
          assignedSemester: `${courseData.assignedDepartment} - Semester ${courseData.assignedSemester} is already taken by "${existingSemesterAssignment.courseName}"` 
        }
      });
    }

    const course = await Course.create(courseData);

    const populatedCourse = await Course.findById(course._id)
      .populate('institute', 'instituteName instituteCode');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        ...populatedCourse.toObject(),
        semesterAssignmentDisplay: `${populatedCourse.assignedDepartment} - Semester ${populatedCourse.assignedSemester}`
      }
    });

    console.log(`✅ Course created: ${course.courseName} (${course.courseCode}) - ${course.assignedDepartment} Semester ${course.assignedSemester}`);

  } catch (error) {
    // ✅ NEW: Handle mongoose validation errors for semester assignment
    if (error.code === 'DUPLICATE_SEMESTER_ASSIGNMENT') {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: { assignedSemester: error.message }
      });
    }
    
    console.error('Error creating course:', error);
    next(error);
  }
};

/**
 * Get single course by ID with semester assignment info
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user.instituteId;

    const course = await Course.findOne({
      _id: courseId,
      institute: instituteId
    })
      .populate('institute', 'instituteName instituteCode')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get course subjects grouped by semester
    const subjects = await Subject.find({ course: courseId })
      .populate('prerequisites.subject', 'subjectName subjectCode')
      .sort({ semester: 1, subjectCode: 1 });

    // Group subjects by semester
    const subjectsBySemester = subjects.reduce((acc, subject) => {
      if (!acc[subject.semester]) {
        acc[subject.semester] = [];
      }
      acc[subject.semester].push(subject);
      return acc;
    }, {});

    // Get enrolled students count
    const enrolledStudents = await Student.countDocuments({
      institute: instituteId,
      course: course.courseName,
      academicStatus: 'Active'
    });

    // ✅ NEW: Get other courses in same department and semester for conflict checking
    const semesterConflicts = await Course.find({
      institute: instituteId,
      assignedDepartment: course.assignedDepartment,
      assignedSemester: course.assignedSemester,
      _id: { $ne: courseId }
    }).select('courseName courseCode');

    res.json({
      success: true,
      data: {
        course: {
          ...course,
          currentEnrollment: enrolledStudents,
          semesterAssignmentDisplay: `${course.assignedDepartment} - Semester ${course.assignedSemester}`,
          totalCredits: course.semesterCredits
        },
        subjectsBySemester,
        totalSubjects: subjects.length,
        semesterAssignmentInfo: {
          department: course.assignedDepartment,
          semester: course.assignedSemester,
          credits: course.semesterCredits,
          conflicts: semesterConflicts
        }
      }
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    next(error);
  }
};

/**
 * Update course with semester assignment validation
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user.instituteId;

    // ✅ ENHANCED: Check course code conflicts if changed
    if (req.body.courseCode) {
      const existingCourse = await Course.findOne({
        institute: instituteId,
        courseCode: req.body.courseCode.toUpperCase(),
        _id: { $ne: courseId }
      });

      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists in your institute',
          errors: { courseCode: 'This course code is already in use' }
        });
      }
    }

    // ✅ NEW: Check semester assignment conflicts if changed
    if (req.body.assignedDepartment || req.body.assignedSemester) {
      const currentCourse = await Course.findById(courseId);
      if (!currentCourse) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const newDepartment = req.body.assignedDepartment || currentCourse.assignedDepartment;
      const newSemester = req.body.assignedSemester || currentCourse.assignedSemester;

      const existingSemesterAssignment = await Course.findOne({
        institute: instituteId,
        assignedDepartment: newDepartment,
        assignedSemester: newSemester,
        _id: { $ne: courseId }
      });

      if (existingSemesterAssignment) {
        return res.status(400).json({
          success: false,
          message: `Another course "${existingSemesterAssignment.courseName}" is already assigned to ${newDepartment} in Semester ${newSemester}`,
          errors: { 
            assignedSemester: `${newDepartment} - Semester ${newSemester} is already taken by "${existingSemesterAssignment.courseName}"` 
          }
        });
      }
    }

    const course = await Course.findOneAndUpdate(
      { _id: courseId, institute: instituteId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('institute', 'instituteName instituteCode');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        ...course.toObject(),
        semesterAssignmentDisplay: `${course.assignedDepartment} - Semester ${course.assignedSemester}`
      }
    });

    console.log(`✅ Course updated: ${course.courseName} (${course.courseCode}) - ${course.assignedDepartment} Semester ${course.assignedSemester}`);

  } catch (error) {
    // ✅ NEW: Handle mongoose validation errors
    if (error.code === 'DUPLICATE_SEMESTER_ASSIGNMENT') {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: { assignedSemester: error.message }
      });
    }

    console.error('Error updating course:', error);
    next(error);
  }
};

/**
 * Delete course with comprehensive validation checks
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user.instituteId;

    const course = await Course.findOne({ _id: courseId, institute: instituteId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // ✅ ENHANCED: Comprehensive deletion checks
    const deletionChecks = await Promise.all([
      // Check subjects
      Subject.countDocuments({ course: courseId }),
      // Check enrolled students
      Student.countDocuments({
        institute: instituteId,
        course: course.courseName
      }),
      // ✅ NEW: Check active enrollments in current academic year
      Student.countDocuments({
        institute: instituteId,
        course: course.courseName,
        academicStatus: 'Active',
        academicYear: course.academicYear
      })
    ]);

    const [subjectCount, totalStudents, activeStudents] = deletionChecks;

    // Build detailed error messages
    const blockingReasons = [];
    if (subjectCount > 0) {
      blockingReasons.push(`${subjectCount} subjects are associated with this course`);
    }
    if (activeStudents > 0) {
      blockingReasons.push(`${activeStudents} students are currently enrolled`);
    }
    if (totalStudents > 0 && activeStudents === 0) {
      blockingReasons.push(`${totalStudents} students have historical enrollment records`);
    }

    if (blockingReasons.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course "${course.courseName}". ${blockingReasons.join(' and ')}.`,
        details: {
          courseInfo: {
            courseName: course.courseName,
            courseCode: course.courseCode,
            assignedDepartment: course.assignedDepartment,
            assignedSemester: course.assignedSemester
          },
          blockingFactors: {
            subjects: subjectCount,
            activeStudents,
            totalStudents
          },
          suggestions: [
            subjectCount > 0 ? 'Delete all associated subjects first' : null,
            activeStudents > 0 ? 'Transfer or graduate enrolled students' : null,
            totalStudents > 0 && activeStudents === 0 ? 'Consider archiving instead of deleting' : null
          ].filter(Boolean)
        }
      });
    }

    await Course.findByIdAndDelete(courseId);

    res.json({
      success: true,
      message: 'Course deleted successfully',
      data: {
        deletedCourse: {
          courseName: course.courseName,
          courseCode: course.courseCode,
          assignedDepartment: course.assignedDepartment,
          assignedSemester: course.assignedSemester
        }
      }
    });

    console.log(`✅ Course deleted: ${course.courseName} (${course.courseCode}) - ${course.assignedDepartment} Semester ${course.assignedSemester}`);

  } catch (error) {
    console.error('Error deleting course:', error);
    next(error);
  }
};

/**
 * Bulk update courses with enhanced actions for semester assignments
 */
export const bulkUpdateCourses = async (req, res, next) => {
  try {
    const { courseIds, action, value } = req.body;
    const instituteId = req.user.instituteId;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid course IDs'
      });
    }

    let updateQuery = {};
    let actionMessage = '';

    switch (action) {
      case 'activate':
        updateQuery = { status: 'Active' };
        actionMessage = 'activated';
        break;
      case 'deactivate':
        updateQuery = { status: 'Inactive' };
        actionMessage = 'deactivated';
        break;
      case 'update_academic_year':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: 'Academic year value is required'
          });
        }
        updateQuery = { academicYear: value };
        actionMessage = `academic year updated to ${value}`;
        break;
      // ✅ NEW: Semester assignment bulk actions
      case 'update_assigned_department':
        if (!value) {
          return res.status(400).json({
            success: false,
            message: 'Assigned department value is required'
          });
        }
        // Check for conflicts before bulk updating
        const conflictingCourses = await Course.find({
          institute: instituteId,
          _id: { $in: courseIds }
        }).select('assignedSemester courseName');
        
        for (const course of conflictingCourses) {
          const existing = await Course.findOne({
            institute: instituteId,
            assignedDepartment: value,
            assignedSemester: course.assignedSemester,
            _id: { $nin: courseIds }
          });
          if (existing) {
            return res.status(400).json({
              success: false,
              message: `Conflict: ${value} - Semester ${course.assignedSemester} is already taken by "${existing.courseName}"`
            });
          }
        }
        updateQuery = { assignedDepartment: value };
        actionMessage = `assigned department updated to ${value}`;
        break;
      case 'update_semester_credits':
        if (!value || value < 1 || value > 8) {
          return res.status(400).json({
            success: false,
            message: 'Semester credits must be between 1 and 8'
          });
        }
        updateQuery = { semesterCredits: parseInt(value) };
        actionMessage = `semester credits updated to ${value}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    const result = await Course.updateMany(
      { _id: { $in: courseIds }, institute: instituteId },
      { $set: { ...updateQuery, updatedAt: Date.now() } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} courses ${actionMessage} successfully`,
      data: {
        coursesAffected: result.modifiedCount,
        action,
        value
      }
    });

    console.log(`✅ Bulk ${action}: ${result.modifiedCount} courses ${actionMessage}`);

  } catch (error) {
    console.error('Bulk update courses error:', error);
    next(error);
  }
};

/**
 * ✅ NEW: Get semester assignments overview
 */
export const getSemesterAssignments = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;

    const assignments = await Course.getSemesterAssignments(instituteId);
    
    // Organize by department and semester
    const departmentView = {};
    const semesterView = {};

    assignments.forEach(assignment => {
      const { department, semester } = assignment._id;
      
      // Department view
      if (!departmentView[department]) {
        departmentView[department] = {};
      }
      departmentView[department][semester] = assignment;

      // Semester view
      if (!semesterView[semester]) {
        semesterView[semester] = {};
      }
      semesterView[semester][department] = assignment;
    });

    res.json({
      success: true,
      data: {
        assignments,
        departmentView,
        semesterView,
        totalAssignments: assignments.length
      }
    });

  } catch (error) {
    console.error('Error fetching semester assignments:', error);
    next(error);
  }
};

/**
 * ✅ NEW: Validate semester assignment availability
 */
export const validateSemesterAssignment = async (req, res, next) => {
  try {
    const { assignedDepartment, assignedSemester, excludeCourseId } = req.body;
    const instituteId = req.user.instituteId;

    const query = {
      institute: instituteId,
      assignedDepartment,
      assignedSemester: parseInt(assignedSemester)
    };

    if (excludeCourseId) {
      query._id = { $ne: excludeCourseId };
    }

    const existingCourse = await Course.findOne(query);

    if (existingCourse) {
      return res.json({
        success: false,
        available: false,
        message: `${assignedDepartment} - Semester ${assignedSemester} is already assigned to "${existingCourse.courseName}"`,
        conflictingCourse: {
          courseId: existingCourse._id,
          courseName: existingCourse.courseName,
          courseCode: existingCourse.courseCode
        }
      });
    }

    res.json({
      success: true,
      available: true,
      message: `${assignedDepartment} - Semester ${assignedSemester} is available`
    });

  } catch (error) {
    console.error('Error validating semester assignment:', error);
    next(error);
  }
};

/**
 * Get course statistics for filters including semester assignments
 */
const getCourseStats = async (instituteId) => {
  try {
    const [departments, degreeTypes, academicYears, statusCounts, assignedDepartments] = await Promise.all([
      Course.distinct('department', { institute: instituteId }),
      Course.distinct('degreeType', { institute: instituteId }),
      Course.distinct('academicYear', { institute: instituteId }),
      Course.aggregate([
        { $match: { institute: instituteId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } }
          }
        }
      ]),
      // ✅ NEW: Get assigned departments for filtering
      Course.distinct('assignedDepartment', { institute: instituteId })
    ]);

    return {
      availableDepartments: departments.filter(Boolean).sort(),
      availableDegreeTypes: degreeTypes.filter(Boolean).sort(),
      availableAcademicYears: academicYears.filter(Boolean).sort((a, b) => b.localeCompare(a)),
      availableAssignedDepartments: assignedDepartments.filter(Boolean).sort(), // ✅ NEW
      statusCounts: statusCounts[0] || {
        total: 0, active: 0, inactive: 0, draft: 0
      }
    };
  } catch (error) {
    console.error('Course stats error:', error);
    return {
      availableDepartments: [],
      availableDegreeTypes: [],
      availableAcademicYears: [],
      availableAssignedDepartments: [], // ✅ NEW
      statusCounts: { total: 0, active: 0, inactive: 0, draft: 0 }
    };
  }
};

/**
 * Sync course enrollment counts
 */
export const syncCourseEnrollments = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;
    const courses = await Course.find({ institute: instituteId });
    
    let updatedCount = 0;
    
    for (const course of courses) {
      const enrolledStudents = await Student.countDocuments({
        institute: instituteId,
        course: course.courseName,
        academicStatus: 'Active'
      });
      
      if (course.currentEnrollment !== enrolledStudents) {
        course.currentEnrollment = enrolledStudents;
        await course.save();
        updatedCount++;
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} courses synced successfully`,
      data: {
        totalCourses: courses.length,
        updatedCourses: updatedCount
      }
    });

    console.log(`✅ Synced enrollments for ${updatedCount}/${courses.length} courses`);

  } catch (error) {
    console.error('Sync enrollments error:', error);
    next(error);
  }
};
