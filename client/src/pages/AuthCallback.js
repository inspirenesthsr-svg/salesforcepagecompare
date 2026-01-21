import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const path = window.location.pathname;
    
    if (path === '/auth/success') {
      // Success - check auth status and redirect
      setStatus('success');
      checkAuthStatus().then(() => {
        setTimeout(() => {
          // Use replace to clean URL after redirect
          window.location.replace('/dashboard');
        }, 2000);
      });
    } else if (path === '/auth/error') {
      // Error from callback
      setStatus('error');
    } else if (path === '/auth/callback') {
      // This should be handled by backend redirect, but just in case
      setStatus('processing');
    }
  }, [navigate, checkAuthStatus]);

  const error = searchParams.get('error');
  const description = searchParams.get('description');

  if (status === 'success') {
    return (
      <div className="container">
        <div className="card">
          <div className="success-message">
            <h2>✅ Authentication Successful!</h2>
            <p>You have successfully connected to Salesforce.</p>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container">
        <div className="card">
          <div className="error-message">
            <h2>❌ Authentication Failed</h2>
            <p><strong>Error:</strong> {error || 'Unknown error'}</p>
            {description && <p><strong>Details:</strong> {description}</p>}
          </div>
          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing authentication...</p>
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;

