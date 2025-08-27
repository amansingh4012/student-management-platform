import React from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';

const Header = ({ instituteData, onRefresh }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Welcome message */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 truncate">
            Welcome back, {instituteData?.adminAccount?.adminName || 'Admin'}! 👋
          </h1>
          <div className="flex items-center mt-1 space-x-4">
            <p className="text-sm text-gray-500 truncate">{currentDate}</p>
            <p className="text-sm text-gray-400">•</p>
            <p className="text-sm text-gray-500">{currentTime}</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Search Bar - Hidden on small screens */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students, courses..."
              className="block w-64 xl:w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Search Button for mobile */}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
            <Search className="h-5 w-5" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 relative rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>
          </div>

          {/* Institute Info */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {instituteData?.instituteCode?.charAt(0) || 'I'}
              </span>
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {instituteData?.instituteCode || 'CODE'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
