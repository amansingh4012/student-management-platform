import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterInstitute from './pages/RegisterInstitute';
import LoginInstitute from './pages/LoginInstitute';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Default route - redirect to dashboard if logged in, else login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Authentication routes */}
        <Route path="/register" element={<RegisterInstitute />} />
        <Route path="/login" element={<LoginInstitute />} />
        
        {/* Dashboard route */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 404 fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600 mb-6">Page not found</p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-500">
                Back to Dashboard
              </a>
            </div>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
