import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Bell, 
  Settings, 
  LogOut,
  Building2,
  GraduationCap,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ instituteData, onLogout, collapsed = false, onToggleCollapse }) => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/dashboard/students' },
    { id: 'courses', label: 'Courses', icon: BookOpen, path: '/dashboard/courses' },
    { id: 'batches', label: 'Batches', icon: GraduationCap, path: '/dashboard/batches' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/dashboard/schedule' },
    { id: 'grades', label: 'Grades', icon: FileText, path: '/dashboard/grades' },
    { id: 'fees', label: 'Fees', icon: DollarSign, path: '/dashboard/fees' },
    { id: 'announcements', label: 'Announcements', icon: Bell, path: '/dashboard/announcements' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  const handleItemClick = (item) => {
    setActiveItem(item.id);
    // TODO: Add navigation logic here
  };

  return (
    <div className={`bg-white ${collapsed ? 'w-16' : 'w-64'} min-h-screen shadow-lg border-r border-gray-200 transition-all duration-300 relative`}>
      
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Institute Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0">
  <h1 className="text-lg font-bold text-gray-800 truncate">
    {instituteData?.instituteName || 'Institute'}
  </h1>
  <p className="text-sm text-gray-500 truncate">
    {instituteData?.instituteCode || 'CODE'}
  </p>
</div>
          )}
        </div>
        
        {!collapsed && (
          <div className="mt-3">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {instituteData?.instituteType || 'Educational Institute'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        {!collapsed && (
          <div className="px-6 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Management
            </h2>
          </div>
        )}
        
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <IconComponent className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} ${
                    isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin Info & Logout */}
      <div className={`absolute bottom-0 ${collapsed ? 'w-16' : 'w-64'} p-4 border-t border-gray-200 bg-white`}>
        {collapsed ? (
          <div className="flex justify-center">
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {instituteData?.adminAccount?.adminName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {instituteData?.adminAccount?.adminName || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
