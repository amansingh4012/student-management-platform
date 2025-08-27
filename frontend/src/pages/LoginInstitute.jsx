import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Building2, Mail, Lock, LogIn } from 'lucide-react';
import { authAPI, authUtils } from '../utils/api';
import { validateLoginForm } from '../utils/validation';

const LoginInstitute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    instituteCode: '',
    email: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Handle redirect messages from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      
      // Pre-fill form if coming from registration
      if (location.state.instituteCode) {
        setFormData(prev => ({
          ...prev,
          instituteCode: location.state.instituteCode,
          email: location.state.email || ''
        }));
      }
    }

    // Check if user is already logged in
    if (authUtils.isAuthenticated()) {
      navigate('/dashboard');
    }

    // Check for remembered credentials
    const rememberedCode = localStorage.getItem('remembered_institute_code');
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedCode && rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        instituteCode: rememberedCode,
        email: rememberedEmail
      }));
      setRememberMe(true);
    }
  }, [location, navigate]);

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear API error when user modifies form
    if (apiError) {
      setApiError('');
    }
  };

  // Handle remember me checkbox
  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  // Form submission with comprehensive validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    // Client-side validation
    const validation = validateLoginForm(formData);
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      // Focus on first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.focus();
      return;
    }

    try {
      setLoading(true);
      
      // API call
      const response = await authAPI.login(formData);
      
      // Store authentication data
      authUtils.setAuthData(response.data.token, response.data.institute);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('remembered_institute_code', formData.instituteCode);
        localStorage.setItem('remembered_email', formData.email);
      } else {
        localStorage.removeItem('remembered_institute_code');
        localStorage.removeItem('remembered_email');
      }
      
      // Success feedback
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Login failed:', error);
      setApiError(error.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper (for development)
  const fillDemoCredentials = () => {
    setFormData({
      instituteCode: 'DEMO123',
      email: 'admin@demo.edu',
      password: 'demo123'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Institute Admin Login
            </h1>
            <p className="text-gray-600">
              Access your student management dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white shadow-xl rounded-lg p-8 border border-gray-100">
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-green-800 font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            {/* API Error Message */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-red-800 font-medium">{apiError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Institute Code Field */}
              <div className="space-y-1">
                <label htmlFor="instituteCode" className="block text-sm font-medium text-gray-700">
                  Institute Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="instituteCode"
                    name="instituteCode"
                    type="text"
                    required
                    value={formData.instituteCode}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.instituteCode
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter your institute code (e.g., IIITRANCHI)"
                  />
                </div>
                {formErrors.instituteCode && (
                  <div className="flex items-center text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.instituteCode}
                  </div>
                )}
              </div>

              {/* Admin Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.email
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter your admin email"
                  />
                </div>
                {formErrors.email && (
                  <div className="flex items-center text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.password
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formErrors.password && (
                  <div className="flex items-center text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.password}
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMe}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>

              {/* Demo Credentials (Development only) */}
              {import.meta.env.MODE === 'development' && (
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Fill Demo Credentials
                </button>
              )}
            </form>

            {/* Registration Link */}
            <div className="text-center pt-6 border-t border-gray-200 mt-6">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Register your institute
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure login powered by Student Management Platform v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginInstitute;
