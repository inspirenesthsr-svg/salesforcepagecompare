import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ObjectSelector from '../components/ObjectSelector';
import RecordSelector from '../components/RecordSelector';
import { salesforceAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedObject, setSelectedObject] = useState(null);
  const [capturedRecords, setCapturedRecords] = useState([]);
  const [upgradeState, setUpgradeState] = useState('before');

  useEffect(() => {
    // Load selected object from session on mount
    loadSelectedObject();
    loadCapturedRecords();
    loadUpgradeState();
  }, []);

  const loadUpgradeState = async () => {
    try {
      const response = await salesforceAPI.getUpgradeState();
      if (response.data.success) {
        setUpgradeState(response.data.data.upgradeState);
      }
    } catch (err) {
      console.error('Error loading upgrade state:', err);
    }
  };

  const loadSelectedObject = async () => {
    try {
      const response = await salesforceAPI.getSelectedObject();
      if (response.data.success && response.data.data.selectedObject) {
        setSelectedObject(response.data.data.selectedObject);
      }
    } catch (err) {
      console.error('Error loading selected object:', err);
    }
  };

  const loadCapturedRecords = async () => {
    try {
      const response = await salesforceAPI.getCapturedRecords();
      if (response.data.success) {
        setCapturedRecords(response.data.data.capturedRecords || []);
      }
    } catch (err) {
      console.error('Error loading captured records:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await logout();
      console.log('Logout response:', response);
      
      // If Salesforce logout URL is provided, redirect there first, then to login
      if (response?.data?.data?.salesforceLogoutUrl) {
        const logoutUrl = response.data.data.salesforceLogoutUrl;
        const returnUrl = encodeURIComponent(window.location.origin + '/login');
        console.log('Redirecting to Salesforce logout:', logoutUrl);
        // Redirect to Salesforce logout, which will then redirect back
        window.location.replace(`${logoutUrl}?retUrl=${returnUrl}`);
      } else {
        console.log('No Salesforce logout URL, redirecting to login');
        // Use replace to clean the URL and avoid back button issues
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout fails
      // Use replace to clean the URL
      window.location.replace('/login');
    }
  };

  const handleObjectSelect = (object) => {
    setSelectedObject(object);
    console.log('Object selected:', object);
  };

  const handleRecordSelect = (record) => {
    console.log('Record selected:', record);
  };

  const handleCapture = (captureResult) => {
    console.log('Capture completed:', captureResult);
    // Reload captured records
    loadCapturedRecords();
  };

  const handleUpgradeStateChange = async (newState) => {
    try {
      await salesforceAPI.setUpgradeState(newState);
      setUpgradeState(newState);
    } catch (err) {
      console.error('Error setting upgrade state:', err);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Salesforce Metadata Tracker</h1>
        <div className="header-actions">
          <div className="upgrade-state-selector">
            <label>Upgrade State: </label>
            <select 
              value={upgradeState} 
              onChange={(e) => handleUpgradeStateChange(e.target.value)}
              className="upgrade-select"
            >
              <option value="before">Before Upgrade</option>
              <option value="after">After Upgrade</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/comparison')}>
            Comparison
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {!selectedObject ? (
          <ObjectSelector onObjectSelect={handleObjectSelect} />
        ) : (
          <div>
            <div className="selected-object-banner">
              <p>
                <strong>Selected Object:</strong> {selectedObject.label} ({selectedObject.apiName})
                <button 
                  className="btn-link" 
                  onClick={() => setSelectedObject(null)}
                  style={{ marginLeft: '15px' }}
                >
                  Change Object
                </button>
              </p>
            </div>
            <RecordSelector
              objectName={selectedObject.apiName}
              objectLabel={selectedObject.label}
              onRecordSelect={handleRecordSelect}
              onCapture={handleCapture}
            />
          </div>
        )}

        {capturedRecords.length > 0 && (
          <div className="captured-records-summary">
            <h3>Captured Records ({capturedRecords.length})</h3>
            <div className="captured-list">
              {capturedRecords.map((capture, index) => (
                <div key={index} className="captured-item">
                  <p><strong>{capture.recordName}</strong> ({capture.recordId})</p>
                  <p className="captured-meta">
                    {capture.objectLabel} • {capture.upgradeState || 'before'} • 
                    {new Date(capture.capturedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
