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

// Request interceptor to add auth token (Admin requests only)
API.interceptors.request.use(
  (config) => {
    // ✅ FIXED: Only add institute token for admin routes
    if (config.url?.includes('/auth/institute') || config.url?.includes('/institute')) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // ✅ FIXED: Add student token for student routes
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

// Response interceptor with enhanced error handling
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
        // ✅ IMPROVED: Handle unauthorized for both admin and student
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

// ✅ FIXED: Student Authentication API calls
export const studentAPI = {
  register: (data) => API.post('/auth/student/register', data),
  login: (data) => API.post('/auth/student/login', data),
  
  // ✅ FIXED: Custom profile call with explicit token handling
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

// Institute Management APIs
export const instituteAPI = {
  // Dashboard stats
  getDashboardStats: () => API.get('/institute/dashboard-stats'),
  
  // Student management
  getStudents: (params) => API.get('/institute/students', { params }),
  verifyStudent: (studentId, isVerified) => 
    API.put(`/institute/students/${studentId}/verify`, { isVerified }),
  
  // Existing institute auth functions...
  register: (userData) => API.post('/auth/institute/register', userData),
  login: (userData) => API.post('/auth/institute/login', userData),
  getProfile: () => API.get('/auth/institute/profile')
};

// Health check
export const healthAPI = {
  check: () => axios.get('http://localhost:5000/health'),
};

export default API;
