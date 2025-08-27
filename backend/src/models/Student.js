import mongoose from 'mongoose';

/**
 * Student Model - Belongs to a specific Institute
 * Each student is linked to exactly one institute
 * Students can only be managed by their institute's admin
 */
const studentSchema = new mongoose.Schema({
  // Institute Reference (MOST IMPORTANT - Data Isolation)
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: true,
    index: true // For fast queries
  },
  
  // Student Basic Information
  rollNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  email: {
    type: String,
    required: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  
  // Academic Information
  course: {
    type: String,
    required: true,
    trim: true
  },
  
  currentSemester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    default: 1
  },
  
  // Batch Information
  admissionYear: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  
  graduationYear: {
    type: Number,
    required: true,
    default: function() {
      return this.admissionYear + 4;
    }
  },
  
  batchName: {
    type: String,
    required: true,
    default: function() {
      return `${this.admissionYear}-${this.graduationYear}`;
    }
  },
  
  // Personal Information
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ },
    country: { type: String, default: 'India' }
  },
  
  // Guardian Information
  guardian: {
    name: { type: String, required: true },
    relation: { type: String, enum: ['Father', 'Mother', 'Guardian'], required: true },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    email: { type: String, lowercase: true }
  },
  
  // Academic Status
  academicStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Dropped', 'Suspended'],
    default: 'Active'
  },
  
  // Authentication Information (for student login)

  password: {
    type: String,
    required: true,
    select: false // Don't include in queries by default
  },

  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationOTP: {
    type: String,
    select: false // Don't include in queries by default
  },
  
  otpExpiresAt: {
    type: Date,
    select: false
  },
  
  lastLoginAt: {
    type: Date
  }
  
}, {
  timestamps: true
});

// Compound indexes for institute-based queries (CRITICAL for data isolation)
studentSchema.index({ institute: 1, rollNumber: 1 }, { unique: true }); // Roll number unique per institute
studentSchema.index({ institute: 1, email: 1 }, { unique: true }); // Email unique per institute
studentSchema.index({ institute: 1, currentSemester: 1 });
studentSchema.index({ institute: 1, course: 1 });
studentSchema.index({ institute: 1, batchName: 1 });

// Pre-save middleware to calculate batch information
studentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('admissionYear')) {
    this.graduationYear = this.admissionYear + 4;
    this.batchName = `${this.admissionYear}-${this.graduationYear}`;
  }
  next();
});

export default mongoose.model('Student', studentSchema);
