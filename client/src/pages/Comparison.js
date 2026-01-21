import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesforceAPI } from '../services/api';
import './Comparison.css';

function Comparison() {
  const navigate = useNavigate();
  const [capturedRecords, setCapturedRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCapturedRecords();
  }, []);

  const loadCapturedRecords = async () => {
    try {
      const response = await salesforceAPI.getCapturedRecords();
      if (response.data.success) {
        const records = response.data.data.capturedRecords || [];
        // Filter records that have both before and after screenshots
        const comparableRecords = records.filter((record, index, self) => {
          const hasBefore = record.upgradeState === 'before';
          const hasAfter = self.some(r => 
            r.recordId === record.recordId && 
            r.objectName === record.objectName && 
            r.upgradeState === 'after'
          );
          return hasBefore && hasAfter;
        });
        setCapturedRecords(comparableRecords);
      }
    } catch (err) {
      console.error('Error loading captured records:', err);
      setError('Failed to load captured records');
    }
  };

  const handleCompare = async (record) => {
    setSelectedRecord(record);
    setComparisonResult(null);
    setError(null);
    setIsComparing(true);

    try {
      const response = await salesforceAPI.compareRecord(record.recordId, record.objectName);
      if (response.data.success) {
        setComparisonResult(response.data.data.comparison);
      } else {
        setError(response.data.error?.message || 'Comparison failed');
      }
    } catch (err) {
      console.error('Error comparing screenshots:', err);
      setError(err.response?.data?.error?.message || 'Failed to compare screenshots');
    } finally {
      setIsComparing(false);
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 95) return '#28a745'; // Green
    if (similarity >= 80) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  return (
    <div className="container">
      <div className="comparison-header">
        <h1>OCR Comparison</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="comparison-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="comparison-section">
          <h2>Select Record to Compare</h2>
          {capturedRecords.length === 0 ? (
            <div className="empty-state">
              <p>No records with both "before" and "after" screenshots found.</p>
              <p>Please capture screenshots before and after upgrade to enable comparison.</p>
            </div>
          ) : (
            <div className="records-list">
              {capturedRecords.map((record, index) => (
                <div key={index} className="record-card">
                  <div className="record-info">
                    <h3>{record.recordName || record.recordId}</h3>
                    <p className="record-meta">
                      {record.objectLabel} ({record.objectName}) • {record.recordId}
                    </p>
                    <p className="record-date">
                      Before: {new Date(record.capturedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCompare(record)}
                    disabled={isComparing}
                  >
                    {isComparing && selectedRecord?.recordId === record.recordId
                      ? 'Comparing...'
                      : 'Compare'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isComparing && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Running OCR comparison... This may take a minute.</p>
          </div>
        )}

        {comparisonResult && (
          <div className="comparison-results">
            <h2>Comparison Results</h2>
            {selectedRecord && (
              <div className="result-header">
                <h3>{selectedRecord.recordName || selectedRecord.recordId}</h3>
                <p>{selectedRecord.objectLabel} ({selectedRecord.objectName})</p>
              </div>
            )}

            <div className="similarity-score">
              <div className="score-circle" style={{ borderColor: getSimilarityColor(comparisonResult.similarity) }}>
                <span className="score-value">{comparisonResult.similarity}%</span>
                <span className="score-label">Similarity</span>
              </div>
            </div>

            <div className="comparison-stats">
              <div className="stat-card">
                <h4>Before</h4>
                <p className="stat-value">{comparisonResult.beforeWordCount}</p>
                <p className="stat-label">Words</p>
              </div>
              <div className="stat-card">
                <h4>After</h4>
                <p className="stat-value">{comparisonResult.afterWordCount}</p>
                <p className="stat-label">Words</p>
              </div>
              <div className="stat-card">
                <h4>Common</h4>
                <p className="stat-value">{comparisonResult.commonWordCount}</p>
                <p className="stat-label">Words</p>
              </div>
            </div>

            {comparisonResult.addedWords.length > 0 && (
              <div className="diff-section">
                <h4>Added Words ({comparisonResult.addedWords.length})</h4>
                <div className="diff-tags">
                  {comparisonResult.addedWords.map((word, idx) => (
                    <span key={idx} className="tag tag-added">{word}</span>
                  ))}
                </div>
              </div>
            )}

            {comparisonResult.removedWords.length > 0 && (
              <div className="diff-section">
                <h4>Removed Words ({comparisonResult.removedWords.length})</h4>
                <div className="diff-tags">
                  {comparisonResult.removedWords.map((word, idx) => (
                    <span key={idx} className="tag tag-removed">{word}</span>
                  ))}
                </div>
              </div>
            )}

            {comparisonResult.addedLines.length > 0 && (
              <div className="diff-section">
                <h4>Added Lines ({comparisonResult.addedLines.length})</h4>
                <div className="diff-lines">
                  {comparisonResult.addedLines.map((line, idx) => (
                    <div key={idx} className="line line-added">+ {line}</div>
                  ))}
                </div>
              </div>
            )}

            {comparisonResult.removedLines.length > 0 && (
              <div className="diff-section">
                <h4>Removed Lines ({comparisonResult.removedLines.length})</h4>
                <div className="diff-lines">
                  {comparisonResult.removedLines.map((line, idx) => (
                    <div key={idx} className="line line-removed">- {line}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="full-text-section">
              <details>
                <summary>View Full Extracted Text (Before)</summary>
                <pre className="extracted-text">{comparisonResult.beforeText}</pre>
              </details>
              <details>
                <summary>View Full Extracted Text (After)</summary>
                <pre className="extracted-text">{comparisonResult.afterText}</pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Comparison;
