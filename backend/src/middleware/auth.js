import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import Institute from '../models/Institute.js';

/**
 * Middleware to verify JWT tokens and extract institute information
 * Ensures that admin can only access their institute's data
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if institute still exists and is active
    const institute = await Institute.findById(decoded.instituteId);
    if (!institute || institute.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Institute not found or inactive.'
      });
    }

    // Attach institute and admin info to request
    req.user = {
      instituteId: decoded.instituteId,
      adminId: decoded.adminId,
      instituteName: institute.instituteName,
      instituteCode: institute.instituteCode,
      role: decoded.role || 'admin'
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

/**
 * Middleware to verify student tokens
 */
export const verifyStudentToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    
    // For student tokens, we need both institute and student info
    req.user = {
      studentId: decoded.studentId,
      instituteId: decoded.instituteId,
      role: 'student'
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid student token.',
      error: error.message
    });
  }
};
