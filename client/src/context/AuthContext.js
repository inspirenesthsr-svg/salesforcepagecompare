import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getStatus();
      if (response.data.success) {
        setIsAuthenticated(response.data.data.authenticated);
        setAuthStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await authAPI.logout();
      setIsAuthenticated(false);
      setAuthStatus(null);
      return response; // Return response so Dashboard can access salesforceLogoutUrl
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    authStatus,
    checkAuthStatus,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

