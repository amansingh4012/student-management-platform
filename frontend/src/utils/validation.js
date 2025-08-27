// Validation utility functions
export const validation = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Phone validation (10 digits)
  isValidPhone: (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  },

  // Pincode validation (6 digits)
  isValidPincode: (pincode) => {
    const pincodeRegex = /^[0-9]{6}$/;
    return pincodeRegex.test(pincode);
  },

  // Institute code validation (3-10 uppercase alphanumeric)
  isValidInstituteCode: (code) => {
    const codeRegex = /^[A-Z0-9]{3,10}$/;
    return codeRegex.test(code);
  },

  // Password strength validation
  isValidPassword: (password) => {
    const minLength = parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH) || 6;
    return password.length >= minLength;
  },

  // Name validation (no special characters except spaces)
  isValidName: (name) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  },

  // Required field validation
  isRequired: (value) => {
    return value && value.toString().trim().length > 0;
  }
};

// Form validation for institute registration
export const validateRegistrationForm = (formData) => {
  const errors = {};

  // Institute Information
  if (!validation.isRequired(formData.instituteName)) {
    errors.instituteName = 'Institute name is required';
  } else if (!validation.isValidName(formData.instituteName)) {
    errors.instituteName = 'Institute name contains invalid characters';
  }

  if (!validation.isRequired(formData.instituteCode)) {
    errors.instituteCode = 'Institute code is required';
  } else if (!validation.isValidInstituteCode(formData.instituteCode)) {
    errors.instituteCode = 'Institute code must be 3-10 uppercase letters/numbers';
  }

  if (!validation.isRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validation.isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validation.isRequired(formData.phone)) {
    errors.phone = 'Phone number is required';
  } else if (!validation.isValidPhone(formData.phone)) {
    errors.phone = 'Phone number must be exactly 10 digits';
  }

  if (!validation.isRequired(formData.instituteType)) {
    errors.instituteType = 'Please select institute type';
  }

  // Address validation
  if (!validation.isRequired(formData.address?.street)) {
    errors['address.street'] = 'Street address is required';
  }
  if (!validation.isRequired(formData.address?.city)) {
    errors['address.city'] = 'City is required';
  }
  if (!validation.isRequired(formData.address?.state)) {
    errors['address.state'] = 'State is required';
  }
  if (!validation.isRequired(formData.address?.pincode)) {
    errors['address.pincode'] = 'Pincode is required';
  } else if (!validation.isValidPincode(formData.address.pincode)) {
    errors['address.pincode'] = 'Pincode must be exactly 6 digits';
  }

  // Admin Account validation
  if (!validation.isRequired(formData.adminName)) {
    errors.adminName = 'Admin name is required';
  } else if (!validation.isValidName(formData.adminName)) {
    errors.adminName = 'Admin name contains invalid characters';
  }

  if (!validation.isRequired(formData.adminEmail)) {
    errors.adminEmail = 'Admin email is required';
  } else if (!validation.isValidEmail(formData.adminEmail)) {
    errors.adminEmail = 'Please enter a valid admin email address';
  }

  if (!validation.isRequired(formData.adminPhone)) {
    errors.adminPhone = 'Admin phone is required';
  } else if (!validation.isValidPhone(formData.adminPhone)) {
    errors.adminPhone = 'Admin phone must be exactly 10 digits';
  }

  if (!validation.isRequired(formData.password)) {
    errors.password = 'Password is required';
  } else if (!validation.isValidPassword(formData.password)) {
    errors.password = `Password must be at least ${import.meta.env.VITE_PASSWORD_MIN_LENGTH || 6} characters`;
  }

  if (!validation.isRequired(formData.confirmPassword)) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Form validation for login
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!validation.isRequired(formData.instituteCode)) {
    errors.instituteCode = 'Institute code is required';
  }

  if (!validation.isRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validation.isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validation.isRequired(formData.password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
