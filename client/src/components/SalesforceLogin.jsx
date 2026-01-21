import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './SalesforceLogin.css';

function SalesforceLogin() {
  const [orgType, setOrgType] = useState('production');
  const [customDomain, setCustomDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Get login URL from backend
      const response = await authAPI.getLoginUrl(
        orgType,
        customDomain || null
      );

      if (response.data.success) {
        // Log the URL for debugging (remove in production)
        console.log('OAuth URL:', response.data.data.loginUrl);
        
        // Redirect to Salesforce login page
        window.location.href = response.data.data.loginUrl;
      } else {
        setError(response.data.error?.message || 'Failed to generate login URL');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to initiate login';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="salesforce-login">
      <div className="login-header">
        <h1>Login with Salesforce</h1>
        <p>Connect to your Salesforce org to get started</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="orgType">Org Type</label>
          <select
            id="orgType"
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            disabled={isLoading}
          >
            <option value="production">Production / Developer Org</option>
            <option value="sandbox">Sandbox</option>
          </select>
          <small className="form-help">
            Select the type of Salesforce org you want to connect to
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="customDomain">Custom Domain (Optional)</label>
          <input
            type="text"
            id="customDomain"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="e.g., mycompany.my.salesforce.com"
            disabled={isLoading}
          />
          <small className="form-help">
            If your org uses a custom domain, enter it here (without https://)
          </small>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Login with Salesforce'}
        </button>
      </form>

      <div className="login-info">
        <h3>What happens next?</h3>
        <ol>
          <li>You'll be redirected to Salesforce login page</li>
          <li>Enter your Salesforce credentials</li>
          <li>Authorize the application</li>
          <li>You'll be redirected back to the app</li>
        </ol>
        <p className="security-note">
          🔒 Your credentials are handled securely by Salesforce. We never see or store your password.
        </p>
      </div>
    </div>
  );
}

export default SalesforceLogin;

