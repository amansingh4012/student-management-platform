import React from 'react';

const StatsCard = ({ title, value, description, icon: Icon, color = 'blue', change = null }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
  };

  const [bgColor, textColor, lightBg] = colorClasses[color]?.split(' ') || colorClasses.blue.split(' ');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                change.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {change}
              </span>
              <span className="text-xs text-gray-500 ml-2">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${lightBg}`}>
          <Icon className={`w-8 h-8 ${textColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
