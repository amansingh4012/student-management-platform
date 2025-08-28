import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useRealTimeSync = (userToken, userRole) => {
  const [socket, setSocket] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState([]);
  
  useEffect(() => {
    if (!userToken) return;
    
    const newSocket = io('http://localhost:5000', {
      auth: { token: userToken }
    });
    
    // Handle connection
    newSocket.on('connect', () => {
      console.log('🔗 Real-time connection established');
    });
    
    // Handle grade updates (for students)
    newSocket.on('grade_updated', (data) => {
      console.log('📊 Grade updated:', data);
      setLiveUpdates(prev => [...prev, {
        id: Date.now(),
        type: 'grade_updated',
        message: `New grade uploaded for ${data.course}: ${data.marks}`,
        data,
        timestamp: new Date()
      }]);
      
      // Show notification
      showNotification('Grade Updated', `New grade for ${data.course}: ${data.marks}`);
    });
    
    // Handle verification status (for students)
    newSocket.on('verification_updated', (data) => {
      console.log('✅ Verification updated:', data);
      setLiveUpdates(prev => [...prev, {
        id: Date.now(),
        type: 'verification_updated',
        message: data.isVerified ? 'Account verified!' : 'Account verification revoked',
        data,
        timestamp: new Date()
      }]);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [userToken]);
  
  const showNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };
  
  return { socket, liveUpdates, clearUpdates: () => setLiveUpdates([]) };
};
