import React, { useState, useEffect } from 'react';
import { salesforceAPI } from '../services/api';
import './ObjectSelector.css';

function ObjectSelector({ onObjectSelect }) {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchObjects();
    fetchSelectedObject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesforceAPI.getObjects();
      
      if (response.data.success) {
        setObjects(response.data.data.objects || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch objects');
      }
    } catch (err) {
      console.error('Error fetching objects:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch objects from Salesforce');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedObject = async () => {
    try {
      const response = await salesforceAPI.getSelectedObject();
      if (response.data.success && response.data.data.selectedObject) {
        setSelectedObject(response.data.data.selectedObject);
        if (onObjectSelect) {
          onObjectSelect(response.data.data.selectedObject);
        }
      }
    } catch (err) {
      console.error('Error fetching selected object:', err);
    }
  };

  const handleObjectSelect = async (object) => {
    try {
      const response = await salesforceAPI.selectObject(object.apiName, object.label);
      
      if (response.data.success) {
        setSelectedObject(object);
        if (onObjectSelect) {
          onObjectSelect(object);
        }
      }
    } catch (err) {
      console.error('Error selecting object:', err);
      setError('Failed to select object');
    }
  };

  // Filter objects based on search term
  const filteredObjects = objects.filter(obj => {
    const searchLower = searchTerm.toLowerCase();
    return (
      obj.label.toLowerCase().includes(searchLower) ||
      obj.apiName.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="object-selector-loading">
        <div className="spinner"></div>
        <p>Loading objects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="object-selector-error">
        <div className="error-message">
          <h3>Error Loading Objects</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchObjects}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (objects.length === 0) {
    return (
      <div className="object-selector-empty">
        <p>No objects found with <code>leaseworks__</code> namespace prefix.</p>
        <button className="btn btn-secondary" onClick={fetchObjects}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="object-selector">
      <div className="object-selector-header">
        <h2>Select an Object</h2>
        <p>Choose a LeaseWorks object to work with</p>
      </div>

      <div className="object-selector-search">
        <input
          type="text"
          placeholder="Search objects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="object-selector-list">
        {filteredObjects.length === 0 ? (
          <div className="no-results">
            <p>No objects match your search.</p>
          </div>
        ) : (
          <div className="objects-grid">
            {filteredObjects.map((obj) => (
              <div
                key={obj.apiName}
                className={`object-card ${selectedObject?.apiName === obj.apiName ? 'selected' : ''}`}
                onClick={() => handleObjectSelect(obj)}
              >
                <div className="object-label">{obj.label}</div>
                <div className="object-api-name">({obj.apiName})</div>
                {selectedObject?.apiName === obj.apiName && (
                  <div className="selected-indicator">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedObject && (
        <div className="selected-object-info">
          <h3>Selected Object</h3>
          <p><strong>{selectedObject.label}</strong> ({selectedObject.apiName})</p>
        </div>
      )}
    </div>
  );
}

export default ObjectSelector;

