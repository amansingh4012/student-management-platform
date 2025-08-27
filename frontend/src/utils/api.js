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
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp for debugging
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      timestamp: new Date().toISOString(),
      hasToken: !!token
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
        // Unauthorized - clear storage and redirect
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        
        // Only redirect if not already on login/register pages
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
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

// Authentication API calls
export const authAPI = {
  register: (data) => API.post('/auth/institute/register', data),
  login: (data) => API.post('/auth/institute/login', data),
  getProfile: () => API.get('/auth/institute/profile'),
};

// Utility functions for token management
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

// Health check
export const healthAPI = {
  check: () => axios.get('http://localhost:5000/health'),
};

export default API;
