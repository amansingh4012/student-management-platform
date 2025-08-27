import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Institute from '../../models/Institute.js';
import { config } from '../../config/environment.js';

/**
 * Institute Registration Controller
 * Allows new institutes to register on the platform
 */
export const registerInstitute = async (req, res) => {
  try {
    const {
      instituteName,
      instituteCode,
      email,
      phone,
      address,
      instituteType,
      adminName,
      adminEmail,
      adminPhone,
      password
    } = req.body;

    // Check if institute with same code or email already exists
    const existingInstitute = await Institute.findOne({
      $or: [
        { instituteCode: instituteCode.toUpperCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingInstitute) {
      return res.status(400).json({
        success: false,
        message: 'Institute with this code or email already exists.'
      });
    }

    // Hash the admin password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new institute
    const institute = new Institute({
      instituteName,
      instituteCode: instituteCode.toUpperCase(),
      email: email.toLowerCase(),
      phone,
      address,
      instituteType,
      adminAccount: {
        adminName,
        adminEmail: adminEmail.toLowerCase(),
        adminPhone,
        password: hashedPassword
      }
    });

    await institute.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        instituteId: institute._id,
        adminId: institute._id, // For simplicity, using institute ID as admin ID
        instituteName: institute.instituteName,
        instituteCode: institute.instituteCode,
        role: 'admin'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return success response (don't send password)
    const responseData = institute.toObject();
    delete responseData.adminAccount.password;

    res.status(201).json({
      success: true,
      message: 'Institute registered successfully.',
      data: {
        institute: responseData,
        token,
        expiresIn: config.jwt.expiresIn
      }
    });

    console.log(`✅ New institute registered: ${instituteName} (${instituteCode})`);

  } catch (error) {
    console.error('Institute registration error:', error);
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Institute with this ${field} already exists.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Institute registration failed.',
      error: error.message
    });
  }
};

/**
 * Institute Login Controller
 * Allows institute admins to login to their dashboard
 */
export const loginInstitute = async (req, res) => {
  try {
    const { instituteCode, email, password } = req.body;

    // Find institute by code and admin email
    const institute = await Institute.findOne({
      instituteCode: instituteCode.toUpperCase(),
      'adminAccount.adminEmail': email.toLowerCase(),
      status: 'Active'
    });

    if (!institute) {
      return res.status(401).json({
        success: false,
        message: 'Invalid institute code or admin email.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, institute.adminAccount.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        instituteId: institute._id,
        adminId: institute._id,
        instituteName: institute.instituteName,
        instituteCode: institute.instituteCode,
        role: 'admin'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Return success response
    const responseData = institute.toObject();
    delete responseData.adminAccount.password;

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        institute: responseData,
        token,
        expiresIn: config.jwt.expiresIn
      }
    });

    console.log(`✅ Institute admin logged in: ${institute.instituteName}`);

  } catch (error) {
    console.error('Institute login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
};

/**
 * Get Institute Profile
 * Returns current institute's information
 */
export const getInstituteProfile = async (req, res) => {
  try {
    const institute = await Institute.findById(req.user.instituteId).select('-adminAccount.password');
    
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found.'
      });
    }

    res.json({
      success: true,
      data: institute
    });

  } catch (error) {
    console.error('Get institute profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institute profile.',
      error: error.message
    });
  }
};
