import axios from 'axios';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get storage keys from environment
const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'institute_token';
const USER_DATA_KEY = import.meta.env.VITE_USER_DATA_KEY || 'institute_data';

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    // ✅ Add institute token for admin routes
    if (config.url?.includes('/auth/institute') || config.url?.includes('/institute')) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // ✅ Add student token for student routes
    if (config.url?.includes('/auth/student')) {
      const studentToken = localStorage.getItem('student_token');
      if (studentToken) {
        config.headers.Authorization = `Bearer ${studentToken}`;
      }
    }
    
    // Add timestamp for debugging
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      timestamp: new Date().toISOString(),
      hasToken: !!config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
API.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.url}`, {
      status: response.status,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
  (error) => {
    console.error('🚨 API Response Error:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        // ✅ Handle unauthorized for both admin and student
        if (error.config.url?.includes('/auth/student')) {
          localStorage.removeItem('student_token');
          localStorage.removeItem('student_data');
          
          if (!window.location.pathname.includes('/student/login') && 
              !window.location.pathname.includes('/student/register')) {
            window.location.href = '/student/login';
          }
        } else {
          // Admin unauthorized
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_DATA_KEY);
          
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            window.location.href = '/login';
          }
        }
      }
      
      // Return structured error
      return Promise.reject({
        message: data?.message || `Server error (${status})`,
        status,
        data
      });
    } else if (error.request) {
      // Network error
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
        data: null
      });
    } else {
      // Other error
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: -1,
        data: null
      });
    }
  }
);

// Authentication API calls (Institute Admin)
export const authAPI = {
  register: (data) => API.post('/auth/institute/register', data),
  login: (data) => API.post('/auth/institute/login', data),
  getProfile: () => API.get('/auth/institute/profile'),
};

// Utility functions for admin token management
export const authUtils = {
  // Store authentication data
  setAuthData: (token, instituteData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(instituteData));
  },
  
  // Get stored token
  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  // Get stored institute data
  getInstituteData: () => {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },
  
  // Clear authentication data
  clearAuthData: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }
};

// ✅ Student Authentication API calls
export const studentAPI = {
  register: (data) => API.post('/auth/student/register', data),
  login: (data) => API.post('/auth/student/login', data),
  
  // ✅ Custom profile call with explicit token handling
  getProfile: () => {
    const token = localStorage.getItem('student_token');
    console.log('🔍 Making student profile request with token:', !!token);
    
    return axios.get('http://localhost:5000/api/v1/auth/student/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }).then(response => {
      console.log('✅ Student profile loaded:', response.data);
      return response.data;
    }).catch(error => {
      console.error('❌ Student profile error:', error);
      throw error;
    });
  }
};

// Utility functions for student authentication
export const studentAuthUtils = {
  // Store student authentication data
  setStudentAuthData: (token, studentData) => {
    console.log('💾 Storing student auth data:', { hasToken: !!token, hasData: !!studentData });
    localStorage.setItem('student_token', token);
    localStorage.setItem('student_data', JSON.stringify(studentData));
  },
  
  // Get stored student token
  getStudentToken: () => localStorage.getItem('student_token'),
  
  // Get stored student data
  getStudentData: () => {
    const data = localStorage.getItem('student_data');
    return data ? JSON.parse(data) : null;
  },
  
  // Clear student authentication data
  clearStudentAuthData: () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_data');
  },
  
  // Check if student is authenticated
  isStudentAuthenticated: () => {
    const token = localStorage.getItem('student_token');
    const data = localStorage.getItem('student_data');
    const isAuth = !!(token && data);
    console.log('🔍 Student auth check:', { hasToken: !!token, hasData: !!data, isAuthenticated: isAuth });
    return isAuth;
  }
};

// ✅ ENHANCED Institute Management APIs
export const instituteAPI = {
  // Dashboard stats
  getDashboardStats: () => API.get('/institute/dashboard-stats'),
  
  // ✅ Student management with advanced filtering
  getStudents: (params) => {
    console.log('🔍 Fetching students with params:', params);
    return API.get('/institute/students', { params });
  },
  
  // Single student verification
  verifyStudent: (studentId, isVerified) => 
    API.put(`/institute/students/${studentId}/verify`, { isVerified }),
  
  // ✅ Bulk operations on multiple students
  bulkUpdateStudents: (studentIds, action, value = null) => {
    console.log(`🔄 Bulk ${action} on ${studentIds.length} students`, { studentIds, action, value });
    const payload = { studentIds, action };
    if (value !== null) payload.value = value;
    return API.put('/institute/students/bulk-update', payload);
  },
  
  // ✅ Export student data
  exportStudents: (params = {}) => {
    console.log('📥 Exporting students with filters:', params);
    return axios.get('http://localhost:5000/api/v1/institute/students/export', {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      responseType: 'blob',
      timeout: 30000
    });
  },
  
  // ✅ Bulk actions helper functions
  bulkVerifyStudents: (studentIds) => 
    instituteAPI.bulkUpdateStudents(studentIds, 'verify'),
  
  bulkUnverifyStudents: (studentIds) => 
    instituteAPI.bulkUpdateStudents(studentIds, 'unverify'),
  
  bulkActivateStudents: (studentIds) => 
    instituteAPI.bulkUpdateStudents(studentIds, 'activate'),
  
  bulkDeactivateStudents: (studentIds) => 
    instituteAPI.bulkUpdateStudents(studentIds, 'deactivate'),
  
  bulkUpdateSemester: (studentIds, semester) => 
    instituteAPI.bulkUpdateStudents(studentIds, 'update_semester', semester),

  // ✅ NEW: COURSE MANAGEMENT APIs
  
  // Get courses with advanced filtering
  getCourses: (params) => {
    console.log('📚 Fetching courses with params:', params);
    return API.get('/institute/courses', { params });
  },
  
  // Create new course
  createCourse: (courseData) => {
    console.log('📝 Creating new course:', courseData);
    return API.post('/institute/courses', courseData);
  },
  
  // Get single course with details
  getCourseById: (courseId) => {
    console.log('🔍 Fetching course details:', courseId);
    return API.get(`/institute/courses/${courseId}`);
  },
  
  // Update course
  updateCourse: (courseId, updateData) => {
    console.log('✏️ Updating course:', { courseId, updateData });
    return API.put(`/institute/courses/${courseId}`, updateData);
  },
  
  // Delete course
  deleteCourse: (courseId) => {
    console.log('🗑️ Deleting course:', courseId);
    return API.delete(`/institute/courses/${courseId}`);
  },
  
  // Bulk operations on courses
  bulkUpdateCourses: (courseIds, action, value = null) => {
    console.log(`🔄 Bulk ${action} on ${courseIds.length} courses`, { courseIds, action, value });
    const payload = { courseIds, action };
    if (value !== null) payload.value = value;
    return API.put('/institute/courses/bulk-update', payload);
  },
  
  // Sync course enrollments
  syncCourseEnrollments: () => {
    console.log('🔄 Syncing course enrollments');
    return API.post('/institute/courses/sync-enrollments');
  },
  
  // ✅ Course bulk actions helper functions
  bulkActivateCourses: (courseIds) => 
    instituteAPI.bulkUpdateCourses(courseIds, 'activate'),
  
  bulkDeactivateCourses: (courseIds) => 
    instituteAPI.bulkUpdateCourses(courseIds, 'deactivate'),
  
  bulkUpdateAcademicYear: (courseIds, academicYear) => 
    instituteAPI.bulkUpdateCourses(courseIds, 'update_academic_year', academicYear),
  
  // Existing institute auth functions...
  register: (userData) => API.post('/auth/institute/register', userData),
  login: (userData) => API.post('/auth/institute/login', userData),
  getProfile: () => API.get('/auth/institute/profile')
};

// ✅ NEW: Course management utility functions
export const courseUtils = {
  // Validate course data before submission
  validateCourse: (courseData) => {
    const errors = {};
    
    if (!courseData.courseName?.trim()) {
      errors.courseName = 'Course name is required';
    }
    
    if (!courseData.courseCode?.trim()) {
      errors.courseCode = 'Course code is required';
    }
    
    if (!courseData.department?.trim()) {
      errors.department = 'Department is required';
    }
    
    if (!courseData.degreeType) {
      errors.degreeType = 'Degree type is required';
    }
    
    if (!courseData.duration || courseData.duration < 1) {
      errors.duration = 'Duration must be at least 1 semester';
    }
    
    if (!courseData.totalSemesters || courseData.totalSemesters < 1) {
      errors.totalSemesters = 'Total semesters must be at least 1';
    }
    
    if (!courseData.academicYear?.trim()) {
      errors.academicYear = 'Academic year is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  // Format course for display
  formatCourse: (course) => ({
    ...course,
    fullName: `${course.courseCode} - ${course.courseName}`,
    enrollmentStatus: course.maxStudents === 0 ? 'Open' : 
      course.currentEnrollment >= course.maxStudents ? 'Full' : 'Available',
    enrollmentPercentage: course.maxStudents === 0 ? 0 : 
      Math.round((course.currentEnrollment / course.maxStudents) * 100)
  }),
  
  // Generate course code suggestion
  generateCourseCode: (courseName, department) => {
    const nameWords = courseName?.split(' ').filter(Boolean) || [];
    const deptCode = department?.substring(0, 3).toUpperCase() || 'GEN';
    const nameCode = nameWords.map(word => word.charAt(0).toUpperCase()).join('');
    return `${deptCode}${nameCode}${Date.now().toString().slice(-3)}`;
  }
};

// ✅ File download helper
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ✅ Enhanced API utility functions
export const apiUtils = {
  // Handle bulk operations with loading states
  handleBulkOperation: async (operation, onSuccess, onError) => {
    try {
      const response = await operation();
      console.log('✅ Bulk operation successful:', response);
      if (onSuccess) onSuccess(response);
      return response;
    } catch (error) {
      console.error('❌ Bulk operation failed:', error);
      if (onError) onError(error);
      throw error;
    }
  },
  
  // Handle file exports
  handleExport: async (params, filename = 'export.csv') => {
    try {
      console.log('📥 Starting export...');
      const response = await instituteAPI.exportStudents(params);
      downloadFile(response.data, filename);
      console.log('✅ Export completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    }
  },
  
  // Format API errors for user display
  formatError: (error) => {
    if (error.message) {
      return error.message;
    }
    if (error.status) {
      return `Server error (${error.status}). Please try again.`;
    }
    return 'An unexpected error occurred. Please try again.';
  },
  
  // ✅ NEW: Course-specific utilities
  handleCourseOperation: async (operation, successMessage, onSuccess, onError) => {
    try {
      const response = await operation();
      console.log('✅ Course operation successful:', response);
      if (onSuccess) onSuccess(response, successMessage);
      return response;
    } catch (error) {
      console.error('❌ Course operation failed:', error);
      if (onError) onError(error);
      throw error;
    }
  }
};

// Health check
export const healthAPI = {
  check: () => axios.get('http://localhost:5000/health'),
};

export default API;
