import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, GraduationCap, Mail, Phone, User, Calendar } from 'lucide-react';
import { studentAPI } from '../utils/api';

// InputField component for student form
const StudentInputField = ({ 
  name, 
  type = 'text', 
  placeholder, 
  value, 
  icon: Icon, 
  required = false,
  onChange,
  error,
  children 
}) => (
  <div className="space-y-1">
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      {children || (
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          autoComplete={name.includes('password') ? 'new-password' : 'off'}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-green-500 bg-white hover:border-gray-400'
          }`}
          placeholder={placeholder}
        />
      )}
    </div>
    {error && (
      <div className="flex items-center text-sm text-red-600">
        <AlertCircle className="h-4 w-4 mr-1" />
        {error}
      </div>
    )}
  </div>
);

const RegisterStudent = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    instituteCode: '',
    rollNumber: '',
    name: '',
    email: '',
    phone: '',
    course: '',
    currentSemester: '',
    admissionYear: new Date().getFullYear(),
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    guardian: {
      name: '',
      relation: '',
      phone: '',
      email: ''
    },
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  // Clear password fields on component mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: ''
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else if (name.startsWith('guardian.')) {
      const guardianField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guardian: {
          ...prev.guardian,
          [guardianField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear errors
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Phone validation function
  const validatePhone = (phone) => {
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    // Comprehensive validation
    const errors = {};
    
    // Phone validation
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    
    if (!validatePhone(formData.guardian.phone)) {
      errors['guardian.phone'] = 'Guardian phone number must be exactly 10 digits';
    }

    // Required field validation
    if (!formData.guardian.relation.trim()) {
      errors['guardian.relation'] = 'Guardian relationship is required';
    }

    if (!formData.address.street.trim()) {
      errors['address.street'] = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      errors['address.city'] = 'City is required';
    }

    if (!formData.address.state.trim()) {
      errors['address.state'] = 'State is required';
    }

    if (!formData.address.pincode.trim()) {
      errors['address.pincode'] = 'Pincode is required';
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setLoading(true);
      
      await studentAPI.register(formData);
      
      setSuccess('🎉 Student registration successful! Redirecting to login...');
      
      // Clear password fields after successful registration
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => {
        navigate('/student/login', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.',
            instituteCode: formData.instituteCode,
            rollNumber: formData.rollNumber
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Student registration failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setApiError(`Registration failed: ${errorMessage}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Student Registration
            </h1>
            <p className="text-gray-600">
              Join your institute's student management system
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow-xl rounded-lg p-8">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-800 font-medium">{success}</span>
                </div>
              </div>
            )}

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800 font-medium">{apiError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Institute & Roll Number */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Institute Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StudentInputField
                    name="instituteCode"
                    placeholder="Institute Code (e.g., IIITRANCHI)"
                    value={formData.instituteCode}
                    required
                    onChange={handleChange}
                    error={formErrors.instituteCode}
                  />
                  
                  <StudentInputField
                    name="rollNumber"
                    placeholder="Roll Number (e.g., 21BCE123)"
                    value={formData.rollNumber}
                    required
                    onChange={handleChange}
                    error={formErrors.rollNumber}
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StudentInputField
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    icon={User}
                    required
                    onChange={handleChange}
                    error={formErrors.name}
                  />
                  
                  <StudentInputField
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    icon={Mail}
                    required
                    onChange={handleChange}
                    error={formErrors.email}
                  />
                  
                  <StudentInputField
                    name="phone"
                    type="tel"
                    placeholder="Phone Number (10 digits only)"
                    value={formData.phone}
                    icon={Phone}
                    required
                    onChange={handleChange}
                    error={formErrors.phone}
                  />
                  
                  <StudentInputField
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    icon={Calendar}
                    required
                    onChange={handleChange}
                    error={formErrors.dateOfBirth}
                  />
                  
                  <StudentInputField 
                    name="gender" 
                    required
                    onChange={handleChange}
                    error={formErrors.gender}
                  >
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full pl-3 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-green-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </StudentInputField>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StudentInputField
                    name="course"
                    placeholder="Course/Program"
                    value={formData.course}
                    required
                    onChange={handleChange}
                    error={formErrors.course}
                  />
                  
                  <StudentInputField
                    name="currentSemester"
                    type="number"
                    placeholder="Current Semester"
                    value={formData.currentSemester}
                    required
                    onChange={handleChange}
                    error={formErrors.currentSemester}
                  />
                  
                  <StudentInputField
                    name="admissionYear"
                    type="number"
                    placeholder="Admission Year"
                    value={formData.admissionYear}
                    required
                    onChange={handleChange}
                    error={formErrors.admissionYear}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <StudentInputField
                      name="address.street"
                      placeholder="Street Address"
                      value={formData.address.street}
                      required
                      onChange={handleChange}
                      error={formErrors['address.street']}
                    />
                  </div>
                  
                  <StudentInputField
                    name="address.city"
                    placeholder="City"
                    value={formData.address.city}
                    required
                    onChange={handleChange}
                    error={formErrors['address.city']}
                  />
                  
                  <StudentInputField
                    name="address.state"
                    placeholder="State"
                    value={formData.address.state}
                    required
                    onChange={handleChange}
                    error={formErrors['address.state']}
                  />
                  
                  <StudentInputField
                    name="address.pincode"
                    placeholder="Pincode (6 digits)"
                    value={formData.address.pincode}
                    required
                    onChange={handleChange}
                    error={formErrors['address.pincode']}
                  />
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StudentInputField
                    name="guardian.name"
                    placeholder="Guardian Name"
                    value={formData.guardian.name}
                    required
                    onChange={handleChange}
                    error={formErrors['guardian.name']}
                  />
                  
                  <StudentInputField
                    name="guardian.relation"
                    placeholder="Relationship (e.g., Father, Mother)"
                    value={formData.guardian.relation}
                    required
                    onChange={handleChange}
                    error={formErrors['guardian.relation']}
                  />
                  
                  <StudentInputField
                    name="guardian.phone"
                    type="tel"
                    placeholder="Guardian Phone (10 digits only)"
                    value={formData.guardian.phone}
                    required
                    onChange={handleChange}
                    error={formErrors['guardian.phone']}
                  />
                  
                  <StudentInputField
                    name="guardian.email"
                    type="email"
                    placeholder="Guardian Email (optional)"
                    value={formData.guardian.email}
                    onChange={handleChange}
                    error={formErrors['guardian.email']}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full pl-3 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.password
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-green-500 bg-white hover:border-gray-400'
                      }`}
                      placeholder="Password (min 6 characters)"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    {formErrors.password && (
                      <div className="flex items-center text-sm text-red-600 mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.password}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className={`w-full pl-3 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-green-500 bg-white hover:border-gray-400'
                      }`}
                      placeholder="Confirm Password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    {formErrors.confirmPassword && (
                      <div className="flex items-center text-sm text-red-600 mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {formErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering Student...
                  </div>
                ) : (
                  'Register as Student'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/student/login')}
                    className="text-green-600 hover:text-green-500 font-medium"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
