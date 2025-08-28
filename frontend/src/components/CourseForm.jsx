import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  BookOpen, 
  Building, 
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { instituteAPI } from '../utils/api';

const CourseForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  course = null, 
  loading = false 
}) => {
  console.log('🎯 CourseForm rendered with isOpen:', isOpen);

  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    description: '',
    duration: 4,
    totalSemesters: 4,
    department: '',
    degreeType: 'Undergraduate',
    status: 'Active',
    academicYear: new Date().getFullYear().toString(),
    maxStudents: 0,
    // ✅ NEW: Semester assignment fields
    assignedDepartment: '',
    assignedSemester: '',
    semesterCredits: 3
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [existingCourses, setExistingCourses] = useState([]); // ✅ For validation
  
  // ✅ NEW: Department and Semester options
  const DEPARTMENTS = [
    'Computer Science',
    'Information Technology', 
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Biotechnology',
    'MBA',
    'Commerce'
  ];

  const SEMESTERS = [
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' },
    { value: 3, label: 'Semester 3' },
    { value: 4, label: 'Semester 4' },
    { value: 5, label: 'Semester 5' },
    { value: 6, label: 'Semester 6' },
    { value: 7, label: 'Semester 7' },
    { value: 8, label: 'Semester 8' }
  ];

  // Initialize form data when course prop changes
  useEffect(() => {
    if (course) {
      setFormData({
        courseName: course.courseName || '',
        courseCode: course.courseCode || '',
        description: course.description || '',
        duration: course.duration || 4,
        totalSemesters: course.totalSemesters || 4,
        department: course.department || '',
        degreeType: course.degreeType || 'Undergraduate',
        status: course.status || 'Active',
        academicYear: course.academicYear || new Date().getFullYear().toString(),
        maxStudents: course.maxStudents || 0,
        // ✅ NEW: Load existing assignment data
        assignedDepartment: course.assignedDepartment || '',
        assignedSemester: course.assignedSemester || '',
        semesterCredits: course.semesterCredits || 3
      });
      setShowAdvanced(!!course.description || course.maxStudents > 0);
    } else {
      // Reset form for new course
      setFormData({
        courseName: '',
        courseCode: '',
        description: '',
        duration: 4,
        totalSemesters: 4,
        department: '',
        degreeType: 'Undergraduate',
        status: 'Active',
        academicYear: new Date().getFullYear().toString(),
        maxStudents: 0,
        assignedDepartment: '',
        assignedSemester: '',
        semesterCredits: 3
      });
      setShowAdvanced(false);
    }
    setErrors({});
    
    // ✅ Load existing courses for validation
    loadExistingCourses();
  }, [course, isOpen]);

  // ✅ NEW: Load existing courses for duplicate validation
  const loadExistingCourses = async () => {
    try {
      const response = await instituteAPI.getCourses({ limit: 1000 });
      setExistingCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to load existing courses:', error);
      setExistingCourses([]);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Auto-generate course code
    if (field === 'courseName' && !course) {
      const words = value.split(' ').filter(Boolean);
      const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
      const timestamp = Date.now().toString().slice(-3);
      const suggestedCode = `${initials}${timestamp}`;
      setFormData(prev => ({ ...prev, courseCode: suggestedCode }));
    }
  };

  // ✅ NEW: Validate unique semester assignment
  const validateUniqueSemesterAssignment = () => {
    const { assignedDepartment, assignedSemester } = formData;
    
    if (!assignedDepartment || !assignedSemester) {
      return null; // Skip if not assigned
    }

    const conflictingCourse = existingCourses.find(existingCourse => 
      existingCourse._id !== course?._id && // Don't compare with self when editing
      existingCourse.assignedDepartment === assignedDepartment &&
      existingCourse.assignedSemester === parseInt(assignedSemester)
    );

    if (conflictingCourse) {
      return `Another course "${conflictingCourse.courseName}" is already assigned to ${assignedDepartment} in Semester ${assignedSemester}`;
    }

    return null;
  };

  // ✅ ENHANCED: Validation function
  const validateForm = () => {
    const errors = {};
    
    // Basic validations
    if (!formData.courseName?.trim()) {
      errors.courseName = 'Course name is required';
    }
    
    if (!formData.courseCode?.trim()) {
      errors.courseCode = 'Course code is required';
    }
    
    if (!formData.department?.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!formData.academicYear?.trim()) {
      errors.academicYear = 'Academic year is required';
    }
    
    if (!formData.duration || formData.duration < 1) {
      errors.duration = 'Duration must be at least 1 year';
    }
    
    if (!formData.totalSemesters || formData.totalSemesters < 1) {
      errors.totalSemesters = 'Total semesters must be at least 1';
    }

    // ✅ NEW: Semester assignment validations
    if (!formData.assignedDepartment) {
      errors.assignedDepartment = 'Please select which department will teach this course';
    }

    if (!formData.assignedSemester) {
      errors.assignedSemester = 'Please select in which semester this course will be taught';
    }

    // ✅ NEW: Unique semester assignment validation
    const semesterConflict = validateUniqueSemesterAssignment();
    if (semesterConflict) {
      errors.assignedSemester = semesterConflict;
    }

    if (!formData.semesterCredits || formData.semesterCredits < 1) {
      errors.semesterCredits = 'Credits must be at least 1';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      if (course) {
        response = await instituteAPI.updateCourse(course._id, formData);
        console.log('✅ Course updated:', response);
      } else {
        response = await instituteAPI.createCourse(formData);
        console.log('✅ Course created:', response);
      }
      
      onSave(response.data);
      onClose();
      
    } catch (error) {
      console.error('❌ Form submission failed:', error);
      
      if (error.data?.errors) {
        setErrors(error.data.errors);
      } else {
        setErrors({ 
          general: error.message || 'An error occurred. Please try again.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || loading) return;
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal container */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {course ? 'Edit Course' : 'Create New Course'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {course ? 'Update course information and semester assignment' : 'Add a new course and assign it to a specific semester'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            
            {/* General Error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Info className="w-4 h-4 text-blue-500 mr-2" />
                  Basic Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Course Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      value={formData.courseName}
                      onChange={(e) => handleInputChange('courseName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.courseName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Data Structures and Algorithms"
                      disabled={isSubmitting || loading}
                    />
                    {errors.courseName && (
                      <p className="mt-1 text-sm text-red-600">{errors.courseName}</p>
                    )}
                  </div>

                  {/* Course Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      value={formData.courseCode}
                      onChange={(e) => handleInputChange('courseCode', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.courseCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., CS201"
                      disabled={isSubmitting || loading}
                    />
                    {errors.courseCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.courseCode}</p>
                    )}
                  </div>

                  {/* Course Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Department *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.department ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Computer Science"
                      disabled={isSubmitting || loading}
                    />
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Semester Assignment Section */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <GraduationCap className="w-4 h-4 text-purple-500 mr-2" />
                  Semester Assignment
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Required
                  </span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Assigned Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Department *
                    </label>
                    <select
                      value={formData.assignedDepartment}
                      onChange={(e) => handleInputChange('assignedDepartment', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.assignedDepartment ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting || loading}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.assignedDepartment && (
                      <p className="mt-1 text-sm text-red-600">{errors.assignedDepartment}</p>
                    )}
                  </div>

                  {/* Assigned Semester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semester *
                    </label>
                    <select
                      value={formData.assignedSemester}
                      onChange={(e) => handleInputChange('assignedSemester', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.assignedSemester ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting || loading}
                    >
                      <option value="">Select Semester</option>
                      {SEMESTERS.map(sem => (
                        <option key={sem.value} value={sem.value}>{sem.label}</option>
                      ))}
                    </select>
                    {errors.assignedSemester && (
                      <p className="mt-1 text-sm text-red-600">{errors.assignedSemester}</p>
                    )}
                  </div>

                  {/* Semester Credits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credits *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={formData.semesterCredits}
                      onChange={(e) => handleInputChange('semesterCredits', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.semesterCredits ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting || loading}
                    />
                    {errors.semesterCredits && (
                      <p className="mt-1 text-sm text-red-600">{errors.semesterCredits}</p>
                    )}
                  </div>
                </div>

                {/* ✅ Assignment Info */}
                {formData.assignedDepartment && formData.assignedSemester && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          This course will be taught by <strong>{formData.assignedDepartment}</strong> department 
                          in <strong>Semester {formData.assignedSemester}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Only one course can be assigned per semester per department
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Structure */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-4 h-4 text-green-500 mr-2" />
                  Academic Structure
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Degree Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree Type *
                    </label>
                    <select
                      value={formData.degreeType}
                      onChange={(e) => handleInputChange('degreeType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting || loading}
                    >
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (Years) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.duration ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting || loading}
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                    )}
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => handleInputChange('academicYear', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.academicYear ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 2024-2025"
                      disabled={isSubmitting || loading}
                    />
                    {errors.academicYear && (
                      <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  disabled={isSubmitting || loading}
                >
                  <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Description
                      </label>
                      <textarea
                        rows="3"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of the course..."
                        disabled={isSubmitting || loading}
                      />
                    </div>

                    {/* Max Students */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Students (0 = Unlimited)
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={formData.maxStudents}
                          onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          disabled={isSubmitting || loading}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Fields marked with * are required
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{course ? 'Update Course' : 'Create Course'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;
