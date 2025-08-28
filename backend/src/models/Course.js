import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  // Basic Course Information
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Institute Association
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  },
  
  // Course Details
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // Duration in semesters
    required: true,
    min: 1,
    max: 12
  },
  totalSemesters: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  // Academic Information
  department: {
    type: String,
    required: true,
    trim: true
  },
  degreeType: {
    type: String,
    enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate'],
    required: true
  },
  
  // ✅ NEW: Semester Assignment Fields
  assignedDepartment: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  assignedSemester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    index: true
  },
  semesterCredits: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    default: 3
  },
  
  // Course Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active'
  },
  
  // Academic Year
  academicYear: {
    type: String,
    required: true
  },
  
  // Course Statistics
  maxStudents: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  currentEnrollment: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute' // Admin who created the course
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ ENHANCED: Indexes for better performance including semester assignment
CourseSchema.index({ institute: 1, courseCode: 1 }, { unique: true });
CourseSchema.index({ institute: 1, status: 1 });
CourseSchema.index({ department: 1, degreeType: 1 });
CourseSchema.index({ assignedDepartment: 1, assignedSemester: 1 }); // ✅ NEW: For semester uniqueness
CourseSchema.index({ institute: 1, assignedDepartment: 1, assignedSemester: 1 }, { unique: true }); // ✅ NEW: Unique constraint

// Virtual for enrollment status
CourseSchema.virtual('enrollmentStatus').get(function() {
  if (this.maxStudents === 0) return 'Open';
  if (this.currentEnrollment >= this.maxStudents) return 'Full';
  return 'Available';
});

// Virtual for enrollment percentage
CourseSchema.virtual('enrollmentPercentage').get(function() {
  if (this.maxStudents === 0) return 0;
  return Math.round((this.currentEnrollment / this.maxStudents) * 100);
});

// ✅ NEW: Virtual for full semester assignment info
CourseSchema.virtual('semesterAssignment').get(function() {
  return `${this.assignedDepartment} - Semester ${this.assignedSemester}`;
});

// Pre-save middleware to update timestamps
CourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ NEW: Pre-save middleware to validate unique semester assignment
CourseSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('assignedDepartment') || this.isModified('assignedSemester')) {
    const existingCourse = await this.constructor.findOne({
      institute: this.institute,
      assignedDepartment: this.assignedDepartment,
      assignedSemester: this.assignedSemester,
      _id: { $ne: this._id } // Exclude current document when updating
    });

    if (existingCourse) {
      const error = new Error(`Another course "${existingCourse.courseName}" is already assigned to ${this.assignedDepartment} in Semester ${this.assignedSemester}`);
      error.code = 'DUPLICATE_SEMESTER_ASSIGNMENT';
      return next(error);
    }
  }
  next();
});

// Static method to get courses by institute
CourseSchema.statics.findByInstitute = function(instituteId, filters = {}) {
  return this.find({ institute: instituteId, ...filters })
    .populate('institute', 'instituteName instituteCode')
    .sort({ createdAt: -1 });
};

// ✅ NEW: Static method to get courses by semester assignment
CourseSchema.statics.findBySemesterAssignment = function(instituteId, department, semester) {
  return this.find({ 
    institute: instituteId, 
    assignedDepartment: department, 
    assignedSemester: semester 
  });
};

// ✅ NEW: Static method to get all semester assignments for an institute
CourseSchema.statics.getSemesterAssignments = function(instituteId) {
  return this.aggregate([
    { $match: { institute: new mongoose.Types.ObjectId(instituteId) } },
    {
      $group: {
        _id: {
          department: '$assignedDepartment',
          semester: '$assignedSemester'
        },
        courses: {
          $push: {
            courseId: '$_id',
            courseName: '$courseName',
            courseCode: '$courseCode',
            credits: '$semesterCredits'
          }
        },
        totalCredits: { $sum: '$semesterCredits' }
      }
    },
    { $sort: { '_id.department': 1, '_id.semester': 1 } }
  ]);
};

// Instance method to check if course is full
CourseSchema.methods.isFull = function() {
  if (this.maxStudents === 0) return false;
  return this.currentEnrollment >= this.maxStudents;
};

// Instance method to update enrollment count
CourseSchema.methods.updateEnrollment = async function() {
  const Student = mongoose.model('Student');
  const count = await Student.countDocuments({ 
    institute: this.institute, 
    course: this.courseName,
    academicStatus: 'Active' 
  });
  this.currentEnrollment = count;
  return this.save();
};

// ✅ NEW: Instance method to check semester assignment conflict
CourseSchema.methods.hasAssignmentConflict = async function() {
  const conflictingCourse = await this.constructor.findOne({
    institute: this.institute,
    assignedDepartment: this.assignedDepartment,
    assignedSemester: this.assignedSemester,
    _id: { $ne: this._id }
  });
  return conflictingCourse;
};

export default mongoose.model('Course', CourseSchema);
