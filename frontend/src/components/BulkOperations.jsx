import React, { useState } from 'react';
import { CheckSquare, Square, ChevronDown, Users, CheckCircle, XCircle, Edit, AlertTriangle } from 'lucide-react';

const BulkOperations = ({ 
  selectedStudents, 
  onSelectAll, 
  onBulkAction, 
  totalStudents, 
  loading,
  onClearSelection 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [customSemester, setCustomSemester] = useState('');
  const [showSemesterInput, setShowSemesterInput] = useState(false);
  
  const isAllSelected = selectedStudents.length === totalStudents && totalStudents > 0;
  const isSomeSelected = selectedStudents.length > 0;

  const bulkActions = [
    { 
      id: 'verify', 
      label: 'Verify Selected Students', 
      icon: CheckCircle, 
      color: 'green',
      description: 'Grant access to student portal'
    },
    { 
      id: 'unverify', 
      label: 'Unverify Selected Students', 
      icon: XCircle, 
      color: 'red',
      description: 'Revoke access to student portal'
    },
    { 
      id: 'activate', 
      label: 'Activate Selected Students', 
      icon: CheckCircle, 
      color: 'blue',
      description: 'Mark as academically active'
    },
    { 
      id: 'deactivate', 
      label: 'Deactivate Selected Students', 
      icon: XCircle, 
      color: 'gray',
      description: 'Mark as academically inactive'
    },
    { 
      id: 'update_semester', 
      label: 'Update Semester', 
      icon: Edit, 
      color: 'purple',
      description: 'Change semester for selected students'
    }
  ];

  const handleBulkAction = (actionId) => {
    if (actionId === 'update_semester') {
      setShowSemesterInput(true);
      setShowActions(false);
      return;
    }
    
    const action = bulkActions.find(a => a.id === actionId);
    if (window.confirm(`Are you sure you want to ${action.label.toLowerCase()}? This will affect ${selectedStudents.length} students.`)) {
      onBulkAction(actionId);
      setShowActions(false);
    }
  };

  const handleSemesterUpdate = () => {
    const semester = parseInt(customSemester);
    if (semester < 1 || semester > 12) {
      alert('Please enter a valid semester (1-12)');
      return;
    }
    
    if (window.confirm(`Update ${selectedStudents.length} students to semester ${semester}?`)) {
      onBulkAction('update_semester', semester);
      setShowSemesterInput(false);
      setCustomSemester('');
    }
  };

  if (!isSomeSelected) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSelectAll(!isAllSelected)}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="font-medium">
                {selectedStudents.length === totalStudents ? 'All' : selectedStudents.length} 
                {' '}of {totalStudents} selected
              </span>
            </button>
            
            <div className="h-4 w-px bg-blue-300"></div>
            
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear selection
            </button>
          </div>
          
          {/* Selection Summary */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-blue-600">
            <span className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{selectedStudents.length} students ready for bulk action</span>
            </span>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            <span>{loading ? 'Processing...' : 'Bulk Actions'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showActions ? 'rotate-180' : ''}`} />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  Select Action for {selectedStudents.length} Students
                </div>
                
                {bulkActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleBulkAction(action.id)}
                      disabled={loading}
                      className="w-full px-4 py-3 text-left flex items-start space-x-3 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <Icon className={`w-5 h-5 mt-0.5 text-${action.color}-600`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{action.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semester Update Modal */}
      {showSemesterInput && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">
                Update semester for {selectedStudents.length} students:
              </span>
            </div>
            
            <select
              value={customSemester}
              onChange={(e) => setCustomSemester(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            
            <button
              onClick={handleSemesterUpdate}
              disabled={!customSemester || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Update
            </button>
            
            <button
              onClick={() => {
                setShowSemesterInput(false);
                setCustomSemester('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Warning for Large Selections */}
      {selectedStudents.length > 50 && (
        <div className="mt-3 flex items-center space-x-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            Large selection ({selectedStudents.length} students). Operations may take a few moments to complete.
          </span>
        </div>
      )}
    </div>
  );
};

export default BulkOperations;
