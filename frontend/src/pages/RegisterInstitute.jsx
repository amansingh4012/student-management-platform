import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { authAPI } from '../utils/api';
import { validateRegistrationForm } from '../utils/validation';

// ✅ InputField component moved OUTSIDE to prevent re-render focus loss
const InputField = ({ 
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
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            error
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
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

const RegisterInstitute = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    instituteName: '',
    instituteCode: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    instituteType: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  // ✅ Optimized handleChange function
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear specific field error without causing re-render issues
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Form submission with comprehensive validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    // Client-side validation
    const validation = validateRegistrationForm(formData);
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      setLoading(true);
      
      // API call
      await authAPI.register(formData);
      
      // Success handling
      setSuccess('🎉 Institute registered successfully! Redirecting to login...');
      
      // Auto-redirect after success
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.',
            instituteCode: formData.instituteCode,
            email: formData.adminEmail
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Registration failed:', error);
      setApiError(error.message || 'Registration failed. Please try again.');
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Register Your Institute
            </h1>
            <p className="text-gray-600">
              Join thousands of institutes using our student management platform
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow-xl rounded-lg p-8">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-800 font-medium">{success}</span>
                </div>
              </div>
            )}

            {/* API Error Message */}
            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800 font-medium">{apiError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Institute Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Institute Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    name="instituteName"
                    placeholder="Institute Name"
                    value={formData.instituteName}
                    icon={Building2}
                    required
                    onChange={handleChange}
                    error={formErrors.instituteName}
                  />
                  
                  <InputField
                    name="instituteCode"
                    placeholder="Institute Code (e.g., IIITRANCHI)"
                    value={formData.instituteCode}
                    required
                    onChange={handleChange}
                    error={formErrors.instituteCode}
                  />
                  
                  <InputField
                    name="email"
                    type="email"
                    placeholder="Institute Email"
                    value={formData.email}
                    icon={Mail}
                    required
                    onChange={handleChange}
                    error={formErrors.email}
                  />
                  
                  <InputField
                    name="phone"
                    type="tel"
                    placeholder="Institute Phone (10 digits)"
                    value={formData.phone}
                    icon={Phone}
                    required
                    onChange={handleChange}
                    error={formErrors.phone}
                  />
                  
                  <div className="md:col-span-2">
                    <InputField 
                      name="instituteType" 
                      required
                      onChange={handleChange}
                      error={formErrors.instituteType}
                    >
                      <select
                        name="instituteType"
                        value={formData.instituteType}
                        onChange={handleChange}
                        className={`w-full pl-3 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.instituteType
                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500 bg-white hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select Institute Type</option>
                        <option value="School">School</option>
                        <option value="College">College</option>
                        <option value="University">University</option>
                        <option value="Coaching Institute">Coaching Institute</option>
                        <option value="Technical Institute">Technical Institute</option>
                      </select>
                    </InputField>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <InputField
                      name="address.street"
                      placeholder="Street Address"
                      value={formData.address.street}
                      required
                      onChange={handleChange}
                      error={formErrors['address.street']}
                    />
                  </div>
                  
                  <InputField
                    name="address.city"
                    placeholder="City"
                    value={formData.address.city}
                    required
                    onChange={handleChange}
                    error={formErrors['address.city']}
                  />
                  
                  <InputField
                    name="address.state"
                    placeholder="State"
                    value={formData.address.state}
                    required
                    onChange={handleChange}
                    error={formErrors['address.state']}
                  />
                  
                  <InputField
                    name="address.pincode"
                    placeholder="Pincode (6 digits)"
                    value={formData.address.pincode}
                    required
                    onChange={handleChange}
                    error={formErrors['address.pincode']}
                  />
                </div>
              </div>

              {/* Admin Account Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Administrator Account
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    name="adminName"
                    placeholder="Admin Full Name"
                    value={formData.adminName}
                    required
                    onChange={handleChange}
                    error={formErrors.adminName}
                  />
                  
                  <InputField
                    name="adminPhone"
                    type="tel"
                    placeholder="Admin Phone"
                    value={formData.adminPhone}
                    icon={Phone}
                    required
                    onChange={handleChange}
                    error={formErrors.adminPhone}
                  />
                  
                  <div className="md:col-span-2">
                    <InputField
                      name="adminEmail"
                      type="email"
                      placeholder="Admin Email (for login)"
                      value={formData.adminEmail}
                      icon={Mail}
                      required
                      onChange={handleChange}
                      error={formErrors.adminEmail}
                    />
                  </div>
                  
                  <div className="relative">
                    <InputField
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 6 characters)"
                      value={formData.password}
                      required
                      onChange={handleChange}
                      error={formErrors.password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <InputField
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      required
                      onChange={handleChange}
                      error={formErrors.confirmPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registering Institute...
                    </div>
                  ) : (
                    'Register Institute'
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-blue-500 font-medium"
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

export default RegisterInstitute;
