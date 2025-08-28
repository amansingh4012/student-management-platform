import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Book,
  Calendar,
  CheckSquare,
  Square,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  GraduationCap,  // ✅ NEW
  MapPin,         // ✅ NEW
  Award           // ✅ NEW
} from 'lucide-react';
import { instituteAPI, apiUtils } from '../utils/api';

const CourseList = ({ 
  onCreateCourse, 
  onEditCourse, 
  onViewCourse,
  selectedCourses,
  onCourseSelect,
  onSelectAll,
  onBulkAction 
}) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    department: '',
    degreeType: '',
    status: '',
    academicYear: '',
    // ✅ NEW: Semester assignment filters
    assignedDepartment: '',
    assignedSemester: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching courses with filters:', filters);
      
      const response = await instituteAPI.getCourses(filters);
      
      setCourses(response.data.courses || []);
      setPagination(response.data.pagination || {});
      setStats(response.data.filters || {});
      
      console.log('✅ Courses loaded:', response.data.courses.length);
    } catch (error) {
      console.error('❌ Failed to fetch courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSort = (sortBy) => {
    const sortOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await instituteAPI.deleteCourse(courseId);
      await fetchCourses();
      console.log('✅ Course deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete course:', error);
      // ✅ ENHANCED: Better error handling for course deletion
      const errorMessage = error.message || 'Failed to delete course';
      if (errorMessage.includes('subjects') || errorMessage.includes('students')) {
        alert(`Cannot delete course: ${errorMessage}`);
      } else {
        alert(`Failed to delete course: ${apiUtils.formatError(error)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCourses = async () => {
    try {
      // This will be implemented when we add course export functionality
      console.log('📥 Exporting courses...');
      alert('Export functionality will be implemented in the next step');
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      department: '',
      degreeType: '',
      status: '',
      academicYear: '',
      assignedDepartment: '', // ✅ NEW
      assignedSemester: '',   // ✅ NEW
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const isAllSelected = selectedCourses.length === courses.length && courses.length > 0;
  const isSomeSelected = selectedCourses.length > 0;
  // ✅ ENHANCED: Include semester assignment filters
  const hasActiveFilters = filters.search || filters.department || filters.degreeType || 
                          filters.status || filters.academicYear || filters.assignedDepartment || 
                          filters.assignedSemester;

  return (
    <div className="bg-white rounded-lg shadow">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Course Management
              {isSomeSelected && (
                <span className="ml-2 text-sm text-blue-600 font-normal">
                  ({selectedCourses.length} selected)
                </span>
              )}
            </h2>
            
            <button
              onClick={onCreateCourse}
              className="sm:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={fetchCourses}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center space-x-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={handleExportCourses}
              className="px-4 py-2 border border-gray-300 rounded-lg flex items-center space-x-2 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={onCreateCourse}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 space-y-4">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.statusCounts?.total || 0}</div>
            <div className="text-sm text-blue-600 font-medium">Total Courses</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.statusCounts?.active || 0}</div>
            <div className="text-sm text-green-600 font-medium">Active</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.statusCounts?.inactive || 0}</div>
            <div className="text-sm text-yellow-600 font-medium">Inactive</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.statusCounts?.draft || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Draft</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by course name, code, department, or teaching department..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center space-x-2 transition-colors ${
              showAdvancedFilters || hasActiveFilters
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
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            
            {/* ✅ ENHANCED: Added semester assignment filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange({ department: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Course Departments</option>
                {stats.availableDepartments?.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={filters.degreeType}
                onChange={(e) => handleFilterChange({ degreeType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Degree Types</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={filters.academicYear}
                onChange={(e) => handleFilterChange({ academicYear: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Academic Years</option>
                {stats.availableAcademicYears?.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* ✅ NEW: Teaching Department Filter */}
              <select
                value={filters.assignedDepartment}
                onChange={(e) => handleFilterChange({ assignedDepartment: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teaching Departments</option>
                {stats.availableAssignedDepartments?.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* ✅ NEW: Semester Filter */}
              <select
                value={filters.assignedSemester}
                onChange={(e) => handleFilterChange({ assignedSemester: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Course List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => onSelectAll(!isAllSelected)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('courseName')}
              >
                Course Details
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('department')}
              >
                Department & Type
              </th>
              {/* ✅ NEW: Semester Assignment Column */}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('assignedDepartment')}
              >
                Semester Assignment
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('currentEnrollment')}
              >
                Enrollment
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading courses...</p>
                  </div>
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  <Book className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No courses found</p>
                  <p className="text-sm mb-4">
                    {hasActiveFilters 
                      ? 'Try adjusting your filters or search terms' 
                      : 'Get started by creating your first course'
                    }
                  </p>
                  <button
                    onClick={onCreateCourse}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create First Course
                  </button>
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr 
                  key={course._id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedCourses.includes(course._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course._id)}
                      onChange={() => onCourseSelect(course._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Book className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                        <div className="text-sm text-gray-500">Code: {course.courseCode}</div>
                        <div className="text-xs text-gray-400">
                          {course.duration} years • {course.academicYear}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{course.department}</div>
                    <div className="text-sm text-gray-500">{course.degreeType}</div>
                  </td>
                  
                  {/* ✅ NEW: Semester Assignment Display */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {course.assignedDepartment}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Semester {course.assignedSemester}</span>
                        </div>
                        <div className="text-xs text-purple-600 flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>{course.semesterCredits || course.totalCredits || 3} Credits</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {course.currentEnrollment || 0}
                        {course.maxStudents > 0 && ` / ${course.maxStudents}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {course.subjectCount || 0} subjects
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : course.status === 'Inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === course._id ? null : course._id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {actionMenuOpen === course._id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => {
                              onViewCourse(course._id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              onEditCourse(course);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit Course</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteCourse(course._id);
                              setActionMenuOpen(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Course</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * filters.limit, pagination.totalCourses)} of{' '}
              {pagination.totalCourses} courses
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange({ page: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange({ page: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
