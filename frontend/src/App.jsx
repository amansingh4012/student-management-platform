import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Institute Admin Pages
import RegisterInstitute from './pages/RegisterInstitute';
import LoginInstitute from './pages/LoginInstitute';
import Dashboard from './pages/Dashboard';

// Student Pages
import RegisterStudent from './pages/RegisterStudent';
import LoginStudent from './pages/LoginStudent';
import StudentDashboard from './pages/StudentDashboard';

// Authentication Utils
import { authUtils, studentAuthUtils } from './utils/api';

// ✅ FIXED: Protected Route Component for Institute Admin
const ProtectedAdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const adminToken = localStorage.getItem('institute_token');
        const adminData = localStorage.getItem('institute_data');
        
        console.log('🔍 Checking admin auth:', {
          hasToken: !!adminToken,
          hasData: !!adminData
        });

        if (adminToken && adminData) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔄 Admin not authenticated, redirecting to admin login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Admin authenticated, showing dashboard');
  return children;
};

// ✅ FIXED: Protected Route Component for Students
const ProtectedStudentRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkStudentAuth = () => {
      try {
        const studentToken = localStorage.getItem('student_token');
        const studentData = localStorage.getItem('student_data');
        
        console.log('🔍 Checking student auth:', {
          hasToken: !!studentToken,
          hasData: !!studentData
        });

        if (studentToken && studentData) {
          // Additional token validity check (optional)
          try {
            const tokenPayload = JSON.parse(atob(studentToken.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (tokenPayload.exp && tokenPayload.exp > currentTime) {
              setIsAuthenticated(true);
            } else {
              console.log('🔄 Student token expired');
              localStorage.removeItem('student_token');
              localStorage.removeItem('student_data');
              setIsAuthenticated(false);
            }
          } catch (tokenError) {
            console.log('🔄 Invalid student token format');
            setIsAuthenticated(true); // Still allow if token exists but can't parse
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Student auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkStudentAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking student authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔄 Student not authenticated, redirecting to student login');
    return <Navigate to="/student/login" replace />;
  }

  console.log('✅ Student authenticated, showing student dashboard');
  return children;
};

// ✅ IMPROVED: Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50">
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full text-center">
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Student Management
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600"> Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Complete institute and student management solution
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Multi-tenant Architecture
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Secure Authentication
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Cloud Database
              </span>
            </div>
          </div>

          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            {/* Institute Admin Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Institute Admin</h2>
              <p className="text-gray-600 mb-6">
                Manage your institute, students, courses, and academic operations
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Admin Login
                </button>
                <button
                  onClick={() => window.location.href = '/register'}
                  className="w-full py-3 px-6 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                >
                  Register Institute
                </button>
              </div>
            </div>

            {/* Student Portal Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Portal</h2>
              <p className="text-gray-600 mb-6">
                Access your academic records, courses, grades, and schedules
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/student/login'}
                  className="w-full py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Student Login
                </button>
                <button
                  onClick={() => window.location.href = '/student/register'}
                  className="w-full py-3 px-6 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
                >
                  Register as Student
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Scalable</h3>
              <p className="text-gray-600 text-sm">JWT authentication with multi-tenant architecture</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Complete Management</h3>
              <p className="text-gray-600 text-sm">Student records, courses, grades, and analytics</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile Responsive</h3>
              <p className="text-gray-600 text-sm">Works perfectly on all devices and screen sizes</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>Built with React, Node.js, MongoDB Atlas & Modern Web Technologies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Institute Admin Routes */}
        <Route path="/register" element={<RegisterInstitute />} />
        <Route path="/login" element={<LoginInstitute />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } 
        />
        
        {/* Student Routes */}
        <Route path="/student/register" element={<RegisterStudent />} />
        <Route path="/student/login" element={<LoginStudent />} />
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedStudentRoute>
              <StudentDashboard />
            </ProtectedStudentRoute>
          } 
        />
        
        {/* 404 fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
