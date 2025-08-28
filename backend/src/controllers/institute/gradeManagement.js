import Grade from '../../models/Grade.js';
import Course from '../../models/Course.js';
import Student from '../../models/Student.js';
import { DataSyncService, EVENT_TYPES } from '../../services/eventService.js';
import { websocketService } from '../../services/websocketService.js';

export const uploadGrades = async (req, res, next) => {
  try {
    const { courseId, grades } = req.body; // grades = [{ studentId, marks, comments }]
    const instituteId = req.user.instituteId;
    
    // Validate course belongs to institute
    const course = await Course.findOne({ _id: courseId, institute: instituteId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const updatedGrades = [];
    const studentIds = [];
    
    // Process each grade
    for (const gradeData of grades) {
      const { studentId, marks, comments, gradeType } = gradeData;
      
      // Verify student belongs to institute
      const student = await Student.findOne({ _id: studentId, institute: instituteId });
      if (!student) continue;
      
      // Update or create grade
      const grade = await Grade.findOneAndUpdate(
        { student: studentId, course: courseId, gradeType },
        {
          marks,
          comments,
          uploadedBy: req.user.adminId,
          uploadedAt: new Date()
        },
        { upsert: true, new: true }
      ).populate('student', 'name rollNumber')
       .populate('course', 'courseName courseCode');
      
      updatedGrades.push(grade);
      studentIds.push(studentId);
      
      // 🔥 REAL-TIME SYNC: Notify student immediately
      websocketService.notifyStudent(studentId, 'grade_updated', {
        course: course.courseName,
        courseCode: course.courseCode,
        marks,
        comments,
        gradeType,
        uploadedAt: new Date()
      });
    }
    
    // 🔥 BULK SYNC: Update all affected students
    await DataSyncService.syncGradeData(courseId, studentIds, {
      course: course.courseName,
      gradesCount: updatedGrades.length
    });
    
    res.json({
      success: true,
      message: `${updatedGrades.length} grades uploaded successfully`,
      data: {
        course: course.courseName,
        gradesUploaded: updatedGrades.length,
        studentsAffected: studentIds.length
      }
    });
    
    console.log(`✅ ${updatedGrades.length} grades uploaded for ${course.courseName}`);
    
  } catch (error) {
    console.error('Grade upload error:', error);
    next(error);
  }
};
