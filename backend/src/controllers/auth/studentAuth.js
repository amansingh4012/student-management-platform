import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student from '../../models/Student.js';
import Institute from '../../models/Institute.js';
import { config } from '../../config/environment.js';

/**
 * Student Registration Controller
 * Students register using institute code + their roll number + email
 */
export const registerStudent = async (req, res, next) => {
  try {
    console.log('📥 Student registration data received:', req.body);
    
    const {
      instituteCode,
      rollNumber,
      name,
      email,
      phone,
      course,
      currentSemester,
      admissionYear,
      dateOfBirth,
      gender,
      address,
      guardian,
      password
    } = req.body;

    // Find institute by code
    const institute = await Institute.findOne({
      instituteCode: instituteCode.toUpperCase(),
      status: 'Active'
    });

    if (!institute) {
      const error = new Error('Invalid institute code. Please check with your institute.');
      error.status = 400;
      throw error;
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      institute: institute._id,
      $or: [
        { rollNumber: rollNumber },
        { email: email.toLowerCase() }
      ]
    });

    if (existingStudent) {
      const error = new Error('Student with this roll number or email already exists in this institute.');
      error.status = 400;
      throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new student
    const student = new Student({
      institute: institute._id,
      rollNumber,
      name,
      email: email.toLowerCase(),
      phone,
      course,
      currentSemester,
      admissionYear,
      dateOfBirth,
      gender,
      address,
      guardian,
      password: hashedPassword
    });

    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        studentId: student._id,
        instituteId: institute._id,
        rollNumber: student.rollNumber,
        role: 'student'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return response without password
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      data: {
        student: studentResponse,
        institute: {
          name: institute.instituteName,
          code: institute.instituteCode,
          type: institute.instituteType
        },
        token,
        expiresIn: config.jwt.expiresIn
      }
    });

    console.log(`✅ New student registered: ${name} (${rollNumber}) at ${institute.instituteName}`);

  } catch (error) {
    console.error('🚨 Student registration error:', error);
    next(error); // Pass error to global handler
  }
};

/**
 * Student Login Controller
 */
export const loginStudent = async (req, res, next) => {
  try {
    console.log('🔍 Login request received:', req.body);
    
    const { instituteCode, rollNumber, password } = req.body;

    // Find institute by code
    const institute = await Institute.findOne({
      instituteCode: instituteCode.toUpperCase(),
      status: 'Active'
    });

    if (!institute) {
      const error = new Error('Invalid institute code.');
      error.status = 401;
      throw error;
    }

    console.log('🏢 Institute found:', institute.instituteName, 'ID:', institute._id);

    // Find student in the institute
    const student = await Student.findOne({
      institute: institute._id,
      rollNumber: rollNumber,
      academicStatus: 'Active'
    }).select('+password');

    console.log('🔍 Looking for student with:'); // ✅ ADD THIS
    console.log('   Institute ID:', institute._id); // ✅ ADD THIS  
    console.log('   Roll Number:', rollNumber); // ✅ ADD THIS
    console.log('🎓 Student found:', student ? 'YES' : 'NO'); // ✅ ADD THIS

    if (!student) {
      const error = new Error('Invalid roll number or student not found.');
      error.status = 401;
      throw error;
    }

    // ✅ CHECK VERIFICATION STATUS
    if (!student.isVerified) {
      const error = new Error('Your account is pending verification by the institute. Please contact your administrator.');
      error.status = 403;
      throw error;
    }

    console.log('🔍 Student found:', student.name);
    console.log('🔍 Verification status:', student.isVerified);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    
    if (!isPasswordValid) {
      const error = new Error('Invalid password.');
      error.status = 401;
      throw error;
    }

    // Update last login
    student.lastLoginAt = new Date();
    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        studentId: student._id,
        instituteId: institute._id,
        rollNumber: student.rollNumber,
        role: 'student'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return response without password
    const studentResponse = student.toObject();
    delete studentResponse.password;

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        student: studentResponse,
        institute: {
          name: institute.instituteName,
          code: institute.instituteCode,
          type: institute.instituteType
        },
        token,
        expiresIn: config.jwt.expiresIn
      }
    });

    console.log(`✅ Student logged in: ${student.name} (${rollNumber}) at ${institute.instituteName}`);

  } catch (error) {
    console.error('🚨 Student login error:', error);
    console.error('🚨 Error stack:', error.stack);
    next(error); // Pass to global error handler
  }
};

/**
 * Get Student Profile
 */
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.studentId)
      .populate('institute', 'instituteName instituteCode instituteType')
      .select('-password');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    res.json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile.',
      error: error.message
    });
  }
};


