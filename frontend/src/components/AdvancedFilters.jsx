import React, { useState } from 'react';
import { Search, Filter, Download, Users, RefreshCw, X } from 'lucide-react';

const AdvancedFilters = ({ 
  filters, 
  onFilterChange, 
  onExport, 
  onRefresh,
  loading,
  stats 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value, page: 1 }); // Reset to page 1 when filtering
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: '',
      course: '',
      semester: '',
      admissionYear: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.course || filters.semester || filters.admissionYear;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col space-y-4">
        
        {/* Primary Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, roll number, email, or phone..."
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center space-x-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
            <div className="text-sm text-blue-600 font-medium">Total Students</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="text-2xl font-bold text-green-600">{stats.verified || 0}</div>
            <div className="text-sm text-green-600 font-medium">Verified</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.unverified || 0}</div>
            <div className="text-sm text-yellow-600 font-medium">Pending</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{stats.active || 0}</div>
            <div className="text-sm text-purple-600 font-medium">Active</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Inactive</div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Students</option>
                  <option value="verified">✅ Verified Only</option>
                  <option value="unverified">⏳ Pending Verification</option>
                  <option value="active">🟢 Active Students</option>
                  <option value="inactive">🔴 Inactive Students</option>
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={filters.course || ''}
                  onChange={(e) => handleInputChange('course', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {filters.availableCourses?.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  value={filters.semester || ''}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Semesters</option>
                  {filters.availableSemesters?.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Admission Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Year
                </label>
                <select
                  value={filters.admissionYear || ''}
                  onChange={(e) => handleInputChange('admissionYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Years</option>
                  {filters.availableYears?.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sorting Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Registration Date</option>
                  <option value="name">Name</option>
                  <option value="rollNumber">Roll Number</option>
                  <option value="email">Email</option>
                  <option value="course">Course</option>
                  <option value="currentSemester">Semester</option>
                  <option value="isVerified">Verification Status</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="asc">↑ Ascending (A-Z, 1-9)</option>
                  <option value="desc">↓ Descending (Z-A, 9-1)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;
