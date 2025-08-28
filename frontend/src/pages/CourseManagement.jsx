import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Filter,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  ChevronDown
} from 'lucide-react';
import CourseList from '../components/CourseList';
import CourseForm from '../components/CourseForm';
import BulkOperations from '../components/BulkOperations';
import { instituteAPI, apiUtils } from '../utils/api';

const CourseManagement = () => {
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await instituteAPI.getCourses({ limit: 1 });
      setStats(response.data.filters?.statusCounts || {});
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Course selection handlers
  const handleCourseSelect = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAll = (selectAll) => {
    // This will be handled by the CourseList component
    // passing the current courses array to determine selection
    console.log('Select all courses:', selectAll);
  };

  const handleClearSelection = () => {
    setSelectedCourses([]);
  };

  // Course CRUD operations
  const handleCreateCourse = () => {
    console.log('🎯 CREATE COURSE BUTTON CLICKED!'); // ✅ Debug log
    console.log('Before state change - showCourseForm:', showCourseForm); // ✅ Debug log
    setEditingCourse(null);
    setShowCourseForm(true);
    console.log('After state change - should be true'); // ✅ Debug log
  };

  // Add this useEffect to monitor state changes
  useEffect(() => {
    console.log('📊 Modal state changed:', { showCourseForm, editingCourse }); // ✅ Debug log
  }, [showCourseForm, editingCourse]);

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleViewCourse = (courseId) => {
    // Navigate to course details page (will implement in next steps)
    console.log('View course details:', courseId);
    // For now, just show an alert
    alert(`Course details view will be implemented in the next step. Course ID: ${courseId}`);
  };

  const handleFormSave = async (courseData) => {
    console.log('Course saved:', courseData);
    setLoading(true);
    
    try {
      // Refresh the course list and stats
      await loadStats();
      
      // Show success message
      alert(`Course "${courseData.courseName}" saved successfully!`);
      
      // Close the form
      setShowCourseForm(false);
      setEditingCourse(null);
      
    } catch (error) {
      console.error('Error refreshing after save:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowCourseForm(false);
    setEditingCourse(null);
  };

  // Bulk operations
  const handleBulkAction = async (action, value = null) => {
    if (selectedCourses.length === 0) {
      alert('Please select courses to perform bulk operations.');
      return;
    }

    try {
      setLoading(true);
      console.log(`🔄 Bulk ${action} on ${selectedCourses.length} courses`);

      let actionMessage = '';
      switch (action) {
        case 'activate':
          await instituteAPI.bulkActivateCourses(selectedCourses);
          actionMessage = 'activated';
          break;
        case 'deactivate':
          await instituteAPI.bulkDeactivateCourses(selectedCourses);
          actionMessage = 'deactivated';
          break;
        case 'update_academic_year':
          if (!value) {
            const year = prompt('Enter new academic year (e.g., 2024-2025):');
            if (!year) return;
            value = year;
          }
          await instituteAPI.bulkUpdateAcademicYear(selectedCourses, value);
          actionMessage = `academic year updated to ${value}`;
          break;
        default:
          alert('Invalid bulk action');
          return;
      }

      // Clear selection and refresh
      setSelectedCourses([]);
      await loadStats();
      
      alert(`${selectedCourses.length} courses ${actionMessage} successfully!`);
      console.log(`✅ Bulk ${action} completed successfully`);

    } catch (error) {
      console.error('❌ Bulk operation failed:', error);
      alert(`Bulk operation failed: ${apiUtils.formatError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const bulkActions = [
    { 
      id: 'activate', 
      label: 'Activate Selected Courses',
      description: 'Make courses available for enrollment'
    },
    { 
      id: 'deactivate', 
      label: 'Deactivate Selected Courses',
      description: 'Hide courses from enrollment'
    },
    { 
      id: 'update_academic_year', 
      label: 'Update Academic Year',
      description: 'Change academic year for selected courses'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                  <p className="text-gray-600">Create and manage academic programs</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total || 0}</div>
                  <div className="text-sm text-gray-500">Total Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
                  <div className="text-sm text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.inactive || 0}</div>
                  <div className="text-sm text-gray-500">Inactive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Bulk Operations */}
        {selectedCourses.length > 0 && (
          <div className="mb-6">
            <BulkOperations
              selectedStudents={selectedCourses} // Reusing student bulk operations component
              onSelectAll={handleSelectAll}
              onBulkAction={handleBulkAction}
              totalStudents={stats.total || 0}
              loading={loading}
              onClearSelection={handleClearSelection}
            />
          </div>
        )}

        {/* Course List */}
        <CourseList
          onCreateCourse={handleCreateCourse}
          onEditCourse={handleEditCourse}
          onViewCourse={handleViewCourse}
          selectedCourses={selectedCourses}
          onCourseSelect={handleCourseSelect}
          onSelectAll={handleSelectAll}
          onBulkAction={handleBulkAction}
        />

        {/* ✅ FIXED: CourseForm Modal */}
        <CourseForm
          isOpen={showCourseForm}
          onClose={handleFormClose}
          onSave={handleFormSave}
          course={editingCourse}
          loading={loading}
        />
      </div>

      {/* Custom Bulk Operations for Courses */}
      {selectedCourses.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-96">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action.id)}
                  disabled={loading}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={action.description}
                >
                  {loading ? 'Processing...' : action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
