import mongoose from 'mongoose';

/**
 * Institute/College/School Model
 * This is the main entity that owns all students and data
 * Each institute has complete data isolation
 */
const instituteSchema = new mongoose.Schema({
  // Basic Institute Information
  instituteName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Unique Institute Code (for student verification)
  instituteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 3,
    maxlength: 10,
    match: /^[A-Z0-9]+$/ // Only uppercase letters and numbers
  },
  
  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  
  // Address Information
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[0-9]{6}$/ },
    country: { type: String, default: 'India' }
  },
  
  // Institute Type
  instituteType: {
    type: String,
    enum: ['School', 'College', 'University', 'Coaching Institute', 'Technical Institute'],
    required: true
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  
  // Admin Account Information (Institute's admin)
  adminAccount: {
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminPhone: { type: String, required: true },
    password: { type: String, required: true } // Will be hashed
  },
  
  // Institute Settings
  settings: {
    academicYearStart: { type: Number, default: 7 }, // July = 7
    maxSemesters: { type: Number, default: 8 },
    gradeSystem: { type: String, enum: ['GPA', 'Percentage', 'Marks'], default: 'GPA' }
  }
  
}, {
  timestamps: true // createdAt, updatedAt
});



export default mongoose.model('Institute', instituteSchema);
