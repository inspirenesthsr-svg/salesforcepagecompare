import React, { useState, useEffect } from 'react';
import { salesforceAPI } from '../services/api';
import './RecordSelector.css';

function RecordSelector({ objectName, objectLabel, onRecordSelect, onCapture }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState(null);

  useEffect(() => {
    if (objectName) {
      fetchRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectName]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await salesforceAPI.getRecords(objectName);
      
      if (response.data.success) {
        setRecords(response.data.data.records || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch records');
      }
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setCaptureResult(null);
    if (onRecordSelect) {
      onRecordSelect(record);
    }
  };

  const handleCapture = async () => {
    if (!selectedRecord) return;

    try {
      setCapturing(true);
      setError(null);
      
      const response = await salesforceAPI.captureRecord(selectedRecord.id, selectedRecord.url);
      
      if (response.data.success) {
        setCaptureResult(response.data.data.capture);
        if (onCapture) {
          onCapture(response.data.data.capture);
        }
      } else {
        setError(response.data.error?.message || 'Failed to capture screenshot');
      }
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      setError(err.response?.data?.error?.message || 'Failed to capture screenshot');
    } finally {
      setCapturing(false);
    }
  };

  if (loading) {
    return (
      <div className="record-selector-loading">
        <div className="spinner"></div>
        <p>Loading records...</p>
      </div>
    );
  }

  if (error && records.length === 0) {
    return (
      <div className="record-selector-error">
        <div className="error-message">
          <h3>Error Loading Records</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchRecords}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="record-selector">
      <div className="record-selector-header">
        <h3>Select a Record from {objectLabel}</h3>
        <p>Choose a record to capture screenshot and related lists</p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="records-list">
        {records.length === 0 ? (
          <div className="no-records">
            <p>No records found for this object.</p>
          </div>
        ) : (
          <div className="records-grid">
            {records.map((record) => (
              <div
                key={record.id}
                className={`record-card ${selectedRecord?.id === record.id ? 'selected' : ''}`}
                onClick={() => handleRecordSelect(record)}
              >
                <div className="record-name">{record.name}</div>
                <div className="record-id">{record.id}</div>
                {selectedRecord?.id === record.id && (
                  <div className="selected-indicator">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="record-actions">
          <button
            className="btn btn-primary"
            onClick={handleCapture}
            disabled={capturing}
          >
            {capturing ? 'Capturing...' : 'Capture Screenshot & Related Lists'}
          </button>
        </div>
      )}

      {capturing && (
        <div className="capture-progress">
          <div className="spinner"></div>
          <p>Capturing screenshot and related lists...</p>
          <p className="progress-note">This may take a few moments</p>
        </div>
      )}

      {captureResult && (
        <div className="capture-result">
          <h4>✅ Capture Successful</h4>
          <div className="capture-info">
            <p><strong>Record:</strong> {captureResult.recordName}</p>
            <p><strong>Record ID:</strong> {captureResult.recordId}</p>
            <p><strong>Related Lists Found:</strong> {captureResult.relatedLists?.length || 0}</p>
            <p><strong>Captured At:</strong> {new Date(captureResult.capturedAt).toLocaleString()}</p>
            {captureResult.relatedLists && captureResult.relatedLists.length > 0 && (
              <div className="related-lists-info">
                <strong>Related Lists:</strong>
                <ul>
                  {captureResult.relatedLists.map((list, index) => (
                    <li key={index}>
                      {list.label} {list.count ? `(${list.count})` : ''} - {list.recordIds?.length || 0} records
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordSelector;
