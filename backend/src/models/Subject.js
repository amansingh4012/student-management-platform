import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  // Basic Subject Information
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  
  // Course Association
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true
  },
  
  // Academic Structure
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  academicYear: {
    type: String,
    required: true
  },
  
  // Subject Details
  description: {
    type: String,
    trim: true
  },
  subjectType: {
    type: String,
    enum: ['Core', 'Elective', 'Practical', 'Project', 'Internship'],
    required: true
  },
  
  // Academic Credits & Hours
  credits: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  theoryHours: {
    type: Number,
    default: 0,
    min: 0
  },
  practicalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Prerequisites
  prerequisites: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    subjectName: String,
    subjectCode: String
  }],
  
  // Faculty Assignment
  assignedFaculty: [{
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty' // Will create later
    },
    facultyName: String,
    facultyEmail: String,
    role: {
      type: String,
      enum: ['Primary', 'Co-Teacher', 'Lab-Instructor'],
      default: 'Primary'
    }
  }],
  
  // Curriculum Information
  syllabus: {
    type: String,
    trim: true
  },
  learningOutcomes: [{
    outcome: {
      type: String,
      trim: true
    }
  }],
  textbooks: [{
    title: String,
    author: String,
    isbn: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  
  // Schedule Information
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String, // Format: "09:00"
    endTime: String,   // Format: "10:00"
    type: {
      type: String,
      enum: ['Theory', 'Practical', 'Tutorial'],
      default: 'Theory'
    },
    venue: String
  }],
  
  // Assessment Structure
  assessmentStructure: {
    internalMarks: {
      type: Number,
      default: 40,
      min: 0,
      max: 100
    },
    externalMarks: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    },
    practicalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: 0
    }
  },
  
  // Subject Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active'
  },
  
  // Statistics
  enrolledStudents: {
    type: Number,
    default: 0
  },
  maxCapacity: {
    type: Number,
    default: 0 // 0 means unlimited
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
    ref: 'Institute'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
SubjectSchema.index({ institute: 1, course: 1, semester: 1 });
SubjectSchema.index({ institute: 1, subjectCode: 1 }, { unique: true });
SubjectSchema.index({ course: 1, semester: 1 });
SubjectSchema.index({ status: 1, academicYear: 1 });

// Virtual for total weekly hours
SubjectSchema.virtual('weeklyHours').get(function() {
  return this.schedule.reduce((total, session) => {
    const start = parseInt(session.startTime?.split(':')[0] || 0);
    const end = parseInt(session.endTime?.split(':')[0] || 0);
    return total + (end - start);
  }, 0);
});

// Virtual for subject full name
SubjectSchema.virtual('fullName').get(function() {
  return `${this.subjectCode} - ${this.subjectName}`;
});

// Virtual for capacity status
SubjectSchema.virtual('capacityStatus').get(function() {
  if (this.maxCapacity === 0) return 'Open';
  if (this.enrolledStudents >= this.maxCapacity) return 'Full';
  const percentage = (this.enrolledStudents / this.maxCapacity) * 100;
  if (percentage >= 90) return 'Nearly Full';
  return 'Available';
});

// Pre-save middleware
SubjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total hours
  this.totalHours = this.theoryHours + this.practicalHours;
  
  // Ensure assessment structure totals to 100
  const { internalMarks, externalMarks, practicalMarks } = this.assessmentStructure;
  this.assessmentStructure.totalMarks = internalMarks + externalMarks + practicalMarks;
  
  next();
});

// Static methods
SubjectSchema.statics.findByInstitute = function(instituteId, filters = {}) {
  return this.find({ institute: instituteId, ...filters })
    .populate('course', 'courseName courseCode')
    .populate('institute', 'instituteName')
    .sort({ semester: 1, subjectCode: 1 });
};

SubjectSchema.statics.findByCourse = function(courseId, semester = null) {
  const query = { course: courseId };
  if (semester) query.semester = semester;
  
  return this.find(query)
    .populate('course', 'courseName courseCode')
    .populate('prerequisites.subject', 'subjectName subjectCode')
    .sort({ semester: 1, subjectCode: 1 });
};

SubjectSchema.statics.findBySemester = function(instituteId, semester, academicYear) {
  return this.find({ 
    institute: instituteId, 
    semester, 
    academicYear,
    status: 'Active'
  })
    .populate('course', 'courseName courseCode')
    .sort({ course: 1, subjectCode: 1 });
};

// Instance methods
SubjectSchema.methods.canEnroll = function() {
  if (this.status !== 'Active') return false;
  if (this.maxCapacity === 0) return true;
  return this.enrolledStudents < this.maxCapacity;
};

SubjectSchema.methods.updateEnrollmentCount = async function() {
  // This will be implemented when we have student-subject enrollment
  // For now, just return the current count
  return this.enrolledStudents;
};

SubjectSchema.methods.addPrerequisite = function(subjectId, subjectName, subjectCode) {
  const exists = this.prerequisites.some(p => p.subject.toString() === subjectId.toString());
  if (!exists) {
    this.prerequisites.push({ subject: subjectId, subjectName, subjectCode });
  }
  return this.save();
};

SubjectSchema.methods.removePrerequisite = function(subjectId) {
  this.prerequisites = this.prerequisites.filter(
    p => p.subject.toString() !== subjectId.toString()
  );
  return this.save();
};

export default mongoose.model('Subject', SubjectSchema);
