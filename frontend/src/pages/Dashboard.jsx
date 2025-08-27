import React from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import StatsCard from '../components/ui/StatsCard';

const Dashboard = () => {
  // Mock data - will be replaced with real API data later
  const stats = [
    {
      title: 'Total Students',
      value: '0',
      description: 'Active students enrolled',
      icon: Users,
      color: 'blue',
      change: '+0%'
    },
    {
      title: 'Active Courses',
      value: '0',
      description: 'Currently running courses',
      icon: BookOpen,
      color: 'green',
      change: '+0%'
    },
    {
      title: 'This Month',
      value: '0',
      description: 'New admissions',
      icon: Calendar,
      color: 'purple',
      change: '+0%'
    },
    {
      title: 'Growth Rate',
      value: '0%',
      description: 'Compared to last month',
      icon: TrendingUp,
      color: 'orange',
      change: '+0%'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'info',
      message: 'Welcome to your Student Management Dashboard!',
      time: 'Just now',
      icon: '🎉'
    },
    {
      id: 2,
      type: 'info',
      message: 'Add your first student to get started',
      time: '1 minute ago',
      icon: '👨‍🎓'
    },
    {
      id: 3,
      type: 'info',
      message: 'Configure your institute settings',
      time: '2 minutes ago',
      icon: '⚙️'
    }
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Add New Student',
      description: 'Register a new student to your institute',
      icon: Users,
      color: 'blue',
      action: () => console.log('Add student clicked')
    },
    {
      id: 2,
      title: 'Create Course',
      description: 'Add a new course or program',
      icon: BookOpen,
      color: 'green',
      action: () => console.log('Create course clicked')
    },
    {
      id: 3,
      title: 'Schedule Classes',
      description: 'Manage class schedules and timetables',
      icon: Calendar,
      color: 'purple',
      action: () => console.log('Schedule classes clicked')
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor your institute's performance and activities</p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Quick Add
          </button>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              color={stat.color}
              change={stat.change}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
                <span className="text-sm text-gray-500">Get started quickly</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-600',
                    green: 'bg-green-50 text-green-600',
                    purple: 'bg-purple-50 text-purple-600'
                  };
                  
                  return (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all text-left group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[action.color]}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Getting Started</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <span className="text-gray-700">Add your first students to the system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <span className="text-gray-500">Create courses and assign students</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">3</span>
                  </div>
                  <span className="text-gray-500">Set up class schedules and grading</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Ready to add your first student?</p>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Add Student Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Database: Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">API: Healthy</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Authentication: Active</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
