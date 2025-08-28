import React, { createContext, useContext, useState, useEffect } from 'react';
import { instituteAPI } from '../utils/api';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within FeatureProvider');
  }
  return context;
};

export const FeatureProvider = ({ children }) => {
  const [features, setFeatures] = useState({
    gradeManagement: true,
    attendanceSystem: false,
    communicationHub: true,
    analyticsModule: false
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFeatureConfig();
  }, []);
  
  const loadFeatureConfig = async () => {
    try {
      // Load feature configuration from backend
      const response = await instituteAPI.getFeatureConfig();
      setFeatures(response.data.features);
    } catch (error) {
      console.error('Failed to load feature config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const isFeatureEnabled = (featureName) => {
    return features[featureName] === true;
  };
  
  const toggleFeature = (featureName, enabled) => {
    setFeatures(prev => ({
      ...prev,
      [featureName]: enabled
    }));
  };
  
  return (
    <FeatureContext.Provider value={{
      features,
      isFeatureEnabled,
      toggleFeature,
      loading
    }}>
      {children}
    </FeatureContext.Provider>
  );
};
