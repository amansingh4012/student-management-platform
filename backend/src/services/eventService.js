import { EventEmitter } from 'events';

class PlatformEventEmitter extends EventEmitter {}
export const platformEvents = new PlatformEventEmitter();

// Event types for real-time sync
export const EVENT_TYPES = {
  STUDENT_VERIFIED: 'student:verified',
  STUDENT_UPDATED: 'student:updated',
  GRADE_UPLOADED: 'grade:uploaded',
  ATTENDANCE_MARKED: 'attendance:marked',
  ANNOUNCEMENT_CREATED: 'announcement:created',
  COURSE_UPDATED: 'course:updated'
};

// Real-time data sync service
export class DataSyncService {
  static async syncStudentData(studentId, updateType, data) {
    // Emit event for real-time UI updates
    platformEvents.emit(EVENT_TYPES.STUDENT_UPDATED, {
      studentId,
      updateType,
      data,
      timestamp: new Date()
    });
    
    // Add to notification queue for student
    await NotificationService.notifyStudent(studentId, updateType, data);
  }
  
  static async syncGradeData(courseId, studentIds, gradeData) {
    // Bulk sync for multiple students
    for (const studentId of studentIds) {
      platformEvents.emit(EVENT_TYPES.GRADE_UPLOADED, {
        studentId,
        courseId,
        gradeData,
        timestamp: new Date()
      });
    }
    
    // Send notifications
    await NotificationService.bulkNotifyStudents(studentIds, 'grade_uploaded', gradeData);
  }
}
