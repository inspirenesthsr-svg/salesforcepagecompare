import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SalesforceLogin from '../components/SalesforceLogin';

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Clean URL if there are query parameters (e.g., from Salesforce redirect)
  useEffect(() => {
    if (location.search) {
      // Replace current URL with clean version (no query params)
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container">
      <SalesforceLogin />
    </div>
  );
}

export default LoginPage;

