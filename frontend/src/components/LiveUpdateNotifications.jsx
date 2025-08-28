import React from 'react';
import { CheckCircle, BookOpen, Bell, X } from 'lucide-react';

const LiveUpdateNotifications = ({ updates, onClear }) => {
  if (updates.length === 0) return null;
  
  const getIcon = (type) => {
    switch (type) {
      case 'grade_updated': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'verification_updated': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {updates.slice(-3).map(update => (
        <div key={update.id} className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80 animate-slide-in">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getIcon(update.type)}
              <div>
                <p className="text-sm font-medium text-gray-900">{update.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {update.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onClear(update.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveUpdateNotifications;
