import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ NEW: For navigation
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  BookOpen,      // ✅ NEW: Course icon
  PlusCircle,    // ✅ NEW: Add icon
  BarChart3,     // ✅ NEW: Analytics icon
  Settings       // ✅ NEW: Settings icon
} from 'lucide-react';
import { instituteAPI, apiUtils } from '../utils/api';
import BulkOperations from '../components/BulkOperations';

const Dashboard = () => {
  const navigate = useNavigate(); // ✅ NEW: Navigation hook
  const [stats, setStats] = useState({});
  const [courseStats, setCourseStats] = useState({}); // ✅ NEW: Course statistics
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [verifyingStudent, setVerifyingStudent] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentPage, searchTerm, statusFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ ENHANCED: Load both student and course stats
      const [statsResponse, studentsResponse, coursesResponse] = await Promise.all([
        instituteAPI.getDashboardStats(),
        instituteAPI.getStudents({
          page: currentPage,
          search: searchTerm,
          status: statusFilter,
          limit: 10
        }),
        // Load course statistics
        instituteAPI.getCourses({ limit: 1 }).catch(() => ({ data: { filters: { statusCounts: {} } } }))
      ]);

      setStats(statsResponse.data);
      setStudents(studentsResponse.data.students);
      setPagination(studentsResponse.data.pagination);
      setCourseStats(coursesResponse.data?.filters?.statusCounts || {}); // ✅ NEW
      
      setSelectedStudents([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers (existing)
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedStudents(students.map(s => s._id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Bulk action handler (existing)
  const handleBulkAction = async (action, value = null) => {
    try {
      setLoading(true);
      console.log(`🔄 Executing bulk ${action} on ${selectedStudents.length} students`);
      
      await instituteAPI.bulkUpdateStudents(selectedStudents, action, value);
      
      await loadDashboardData();
      
      console.log(`✅ Bulk ${action} completed successfully`);
      
      const actionMessage = {
        'verify': 'verified',
        'unverify': 'unverified', 
        'activate': 'activated',
        'deactivate': 'deactivated',
        'update_semester': `updated to semester ${value}`
      };
      
      alert(`${selectedStudents.length} students ${actionMessage[action]} successfully!`);
      
    } catch (error) {
      console.error('❌ Bulk action failed:', error);
      alert(`Bulk operation failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Export handler (existing)
  const handleExport = async () => {
    try {
      const params = {
        search: searchTerm,
        status: statusFilter,
        format: 'csv'
      };
      
      await apiUtils.handleExport(params, `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Verify student handler (existing)
  const handleVerifyStudent = async (studentId, isVerified, studentName) => {
    try {
      setVerifyingStudent(studentId);
      
      await instituteAPI.verifyStudent(studentId, isVerified);
      
      setStudents(prev => prev.map(student => 
        student._id === studentId 
          ? { ...student, isVerified }
          : student
      ));

      setStats(prev => ({
        ...prev,
        verifiedStudents: isVerified ? prev.verifiedStudents + 1 : prev.verifiedStudents - 1,
        unverifiedStudents: isVerified ? prev.unverifiedStudents - 1 : prev.unverifiedStudents + 1
      }));

      console.log(`✅ Student ${studentName} ${isVerified ? 'verified' : 'unverified'} successfully`);

    } catch (error) {
      console.error('Failed to update student verification:', error);
      alert(`Failed to ${isVerified ? 'verify' : 'unverify'} student. Please try again.`);
    } finally {
      setVerifyingStudent(null);
    }
  };

  // Search and filter handlers (existing)
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Institute Dashboard</h1>
                <p className="text-gray-600">Manage students, courses, and monitor your institute</p>
              </div>
              
              {/* ✅ NEW: Quick Actions */}
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Manage Courses</span>
                </button>
                <button
                  onClick={() => alert('Analytics module coming soon!')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ✅ NEW: Navigation Tabs */}
        <div className="mb-8">
          <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md flex items-center space-x-2 font-medium"
            >
              <Users className="w-4 h-4" />
              <span>Student Management</span>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Course Management</span>
            </button>
            <button
              onClick={() => alert('Coming soon!')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* ✅ ENHANCED: Combined Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Student Stats */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verified Students</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.verifiedStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Verification</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unverifiedStudents || 0}</p>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Course Stats Card */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Courses</p>
                <p className="text-2xl font-semibold text-gray-900">{courseStats.active || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Course Management</h3>
                <p className="text-sm text-gray-500">Create and manage academic programs</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/courses')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Courses
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
                <p className="text-sm text-gray-500">Overview of key metrics</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.recentRegistrations || 0}</div>
              <div className="text-sm text-gray-500">New registrations this week</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">System Health</h3>
                <p className="text-sm text-gray-500">Platform status overview</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-green-600 font-medium">All systems operational</div>
            </div>
          </div>
        </div>

        {/* Bulk Operations (existing) */}
        {selectedStudents.length > 0 && (
          <BulkOperations
            selectedStudents={selectedStudents}
            onSelectAll={handleSelectAll}
            onBulkAction={handleBulkAction}
            totalStudents={students.length}
            loading={loading}
            onClearSelection={() => setSelectedStudents([])}
          />
        )}

        {/* Student Management (existing with minor enhancements) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-medium text-gray-900">
                Student Management
                {selectedStudents.length > 0 && (
                  <span className="ml-2 text-sm text-blue-600 font-normal">
                    ({selectedStudents.length} selected)
                  </span>
                )}
              </h2>
              
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Students</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Pending Verification</option>
                </select>

                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student List (existing table code) */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onChange={() => handleSelectAll(selectedStudents.length !== students.length)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course & Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">Students will appear here once they register</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr 
                      key={student._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedStudents.includes(student._id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleSelectStudent(student._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">Roll: {student.rollNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.course}</div>
                        <div className="text-sm text-gray-500">Semester {student.currentSemester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {student.isVerified ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          {student.isVerified ? (
                            <button
                              onClick={() => handleVerifyStudent(student._id, false, student.name)}
                              disabled={verifyingStudent === student._id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {verifyingStudent === student._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Unverify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyStudent(student._id, true, student.name)}
                              disabled={verifyingStudent === student._id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {verifyingStudent === student._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-1"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Verify
                            </button>
                          )}
                          <button className="text-blue-600 hover:text-blue-900 flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (existing) */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.totalStudents)} of {pagination.totalStudents} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
