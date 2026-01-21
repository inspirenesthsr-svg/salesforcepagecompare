import express from 'express';
import axios from 'axios';
import { captureRecordScreenshot } from '../services/screenshotService.js';
import { compareRecordScreenshots } from '../services/comparisonService.js';

const router = express.Router();

/**
 * GET /api/salesforce/objects
 * Get all Salesforce objects with specified namespace prefix
 * Cached in session
 */
router.get('/objects', async (req, res) => {
  try {
    const { namespace = 'leaseworks__' } = req.query;
    const accessToken = req.session.accessToken;
    const instanceUrl = req.session.instanceUrl;

    if (!accessToken || !instanceUrl) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Not authenticated. Please login first.'
        }
      });
    }

    // Check session cache first
    const cacheKey = `objects_${namespace}`;
    if (req.session[cacheKey] && req.session[`${cacheKey}_timestamp`]) {
      const cacheAge = Date.now() - req.session[`${cacheKey}_timestamp`];
      const cacheMaxAge = 60 * 60 * 1000; // 1 hour

      if (cacheAge < cacheMaxAge) {
        console.log('Returning cached objects list');
        return res.json({
          success: true,
          data: {
            objects: req.session[cacheKey],
            cached: true
          }
        });
      }
    }

    // Fetch objects from Salesforce REST API
    const apiVersion = 'v58.0'; // Use latest stable version
    const describeUrl = `${instanceUrl}/services/data/${apiVersion}/sobjects/`;

    const response = await axios.get(describeUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Filter objects by namespace prefix
    const allObjects = response.data.sobjects || [];
    const filteredObjects = allObjects
      .filter(obj => {
        // Filter by namespace prefix
        return obj.name && obj.name.startsWith(namespace);
      })
      .map(obj => ({
        label: obj.label || obj.name,
        apiName: obj.name,
        keyPrefix: obj.keyPrefix,
        custom: obj.custom || false
      }))
      .sort((a, b) => {
        // Sort by label alphabetically
        return (a.label || '').localeCompare(b.label || '');
      });

    // Store in session cache
    req.session[cacheKey] = filteredObjects;
    req.session[`${cacheKey}_timestamp`] = Date.now();

    res.json({
      success: true,
      data: {
        objects: filteredObjects,
        cached: false,
        count: filteredObjects.length
      }
    });
  } catch (error) {
    console.error('Error fetching objects:', error);
    
    const errorMessage = error.response?.data?.error_description 
      || error.response?.data?.message 
      || error.message 
      || 'Failed to fetch objects from Salesforce';

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'FETCH_OBJECTS_ERROR',
        message: errorMessage,
        details: error.response?.data
      }
    });
  }
});

/**
 * POST /api/salesforce/objects/select
 * Store selected object in session
 */
router.post('/objects/select', (req, res) => {
  try {
    const { apiName, label } = req.body;

    if (!apiName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_API_NAME',
          message: 'Object API name is required'
        }
      });
    }

    // Store selected object in session
    req.session.selectedObject = {
      apiName,
      label: label || apiName,
      selectedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        selectedObject: req.session.selectedObject
      }
    });
  } catch (error) {
    console.error('Error storing selected object:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STORE_OBJECT_ERROR',
        message: 'Failed to store selected object'
      }
    });
  }
});

/**
 * GET /api/salesforce/objects/selected
 * Get currently selected object from session
 */
router.get('/objects/selected', (req, res) => {
  try {
    const selectedObject = req.session.selectedObject || null;

    res.json({
      success: true,
      data: {
        selectedObject
      }
    });
  } catch (error) {
    console.error('Error getting selected object:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_OBJECT_ERROR',
        message: 'Failed to get selected object'
      }
    });
  }
});

/**
 * GET /api/salesforce/objects/:objectName/records
 * Get records for a specific object
 */
router.get('/objects/:objectName/records', async (req, res) => {
  try {
    const { objectName } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const accessToken = req.session.accessToken;
    const instanceUrl = req.session.instanceUrl;

    if (!accessToken || !instanceUrl) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Not authenticated. Please login first.'
        }
      });
    }

    // Query records using REST API
    const apiVersion = 'v58.0';
    const query = `SELECT Id, Name FROM ${objectName} ORDER BY CreatedDate DESC LIMIT ${limit} OFFSET ${offset}`;
    const queryUrl = `${instanceUrl}/services/data/${apiVersion}/query/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(queryUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const records = response.data.records.map(record => ({
      id: record.Id,
      name: record.Name || record.Id,
      url: `${instanceUrl}/lightning/r/${objectName}/${record.Id}/view`
    }));

    res.json({
      success: true,
      data: {
        records: records,
        totalSize: response.data.totalSize,
        done: response.data.done
      }
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    
    const errorMessage = error.response?.data?.error_description 
      || error.response?.data?.message 
      || error.message 
      || 'Failed to fetch records from Salesforce';

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        code: 'FETCH_RECORDS_ERROR',
        message: errorMessage,
        details: error.response?.data
      }
    });
  }
});

/**
 * POST /api/salesforce/records/:recordId/capture
 * Capture screenshot and related lists for a record
 */
router.post('/records/:recordId/capture', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { recordUrl } = req.body;
    const accessToken = req.session.accessToken;
    const instanceUrl = req.session.instanceUrl;

    if (!accessToken || !instanceUrl) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Not authenticated. Please login first.'
        }
      });
    }

    if (!recordUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RECORD_URL',
          message: 'Record URL is required'
        }
      });
    }

    // Get selected object from session
    const selectedObject = req.session.selectedObject;
    if (!selectedObject) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_OBJECT_SELECTED',
          message: 'Please select an object first'
        }
      });
    }

    // Determine upgrade state (before or after)
    // Check if upgrade state is provided in request, otherwise default to 'before'
    // If a 'before' screenshot already exists for this record, assume this is 'after'
    const upgradeState = req.body.upgradeState || 
      (req.session.capturedRecords?.some(c => c.recordId === recordId && c.upgradeState === 'before') ? 'after' : 'before');
    
    // Store upgrade state in session for tracking
    if (!req.session.upgradeState) {
      req.session.upgradeState = upgradeState;
    }

    console.log('Starting screenshot capture for record:', recordId, 'upgrade state:', upgradeState);

    // Capture screenshot using Playwright
    const captureResult = await captureRecordScreenshot(
      recordUrl,
      accessToken,
      instanceUrl,
      recordId,
      selectedObject.apiName,
      upgradeState
    );

    // Store capture metadata in session (will be moved to database later)
    if (!req.session.capturedRecords) {
      req.session.capturedRecords = [];
    }

    // Remove any existing capture for this record+upgradeState combination
    req.session.capturedRecords = req.session.capturedRecords.filter(
      c => !(c.recordId === recordId && c.upgradeState === upgradeState)
    );

    const captureMetadata = {
      recordId: recordId,
      recordUrl: recordUrl,
      objectName: selectedObject.apiName,
      objectLabel: selectedObject.label,
      upgradeState: upgradeState,
      screenshotPath: captureResult.screenshotPath,
      screenshotFilename: captureResult.screenshotFilename,
      recordName: captureResult.recordName,
      capturedAt: captureResult.capturedAt
    };

    req.session.capturedRecords.push(captureMetadata);

    res.json({
      success: true,
      data: {
        capture: captureMetadata
      }
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CAPTURE_ERROR',
        message: error.message || 'Failed to capture screenshot',
        details: error.stack
      }
    });
  }
});

/**
 * POST /api/salesforce/upgrade-state
 * Set the upgrade state (before or after)
 */
router.post('/upgrade-state', (req, res) => {
  try {
    const { upgradeState } = req.body;
    
    if (!upgradeState || !['before', 'after'].includes(upgradeState)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_UPGRADE_STATE',
          message: 'upgradeState must be "before" or "after"'
        }
      });
    }

    req.session.upgradeState = upgradeState;

    res.json({
      success: true,
      data: {
        upgradeState: upgradeState
      }
    });
  } catch (error) {
    console.error('Error setting upgrade state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPGRADE_STATE_ERROR',
        message: error.message || 'Failed to set upgrade state'
      }
    });
  }
});

/**
 * GET /api/salesforce/upgrade-state
 * Get the current upgrade state
 */
router.get('/upgrade-state', (req, res) => {
  try {
    const upgradeState = req.session.upgradeState || 'before';

    res.json({
      success: true,
      data: {
        upgradeState: upgradeState
      }
    });
  } catch (error) {
    console.error('Error getting upgrade state:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPGRADE_STATE_ERROR',
        message: error.message || 'Failed to get upgrade state'
      }
    });
  }
});

/**
 * GET /api/salesforce/records/captured
 * Get all captured records from session
 */
router.get('/records/captured', (req, res) => {
  try {
    const capturedRecords = req.session.capturedRecords || [];

    res.json({
      success: true,
      data: {
        capturedRecords: capturedRecords,
        count: capturedRecords.length
      }
    });
  } catch (error) {
    console.error('Error getting captured records:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CAPTURED_ERROR',
        message: 'Failed to get captured records'
      }
    });
  }
});

/**
 * POST /api/salesforce/records/:recordId/compare
 * Compare before and after screenshots for a record using OCR
 */
router.post('/records/:recordId/compare', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { objectApiName } = req.body;

    if (!objectApiName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_OBJECT_NAME',
          message: 'objectApiName is required'
        }
      });
    }

    console.log('Starting OCR comparison for:', objectApiName, recordId);

    const comparisonResult = await compareRecordScreenshots(objectApiName, recordId);

    res.json({
      success: true,
      data: {
        recordId: recordId,
        objectApiName: objectApiName,
        comparison: comparisonResult
      }
    });
  } catch (error) {
    console.error('Error comparing screenshots:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPARISON_ERROR',
        message: error.message || 'Failed to compare screenshots',
        details: error.stack
      }
    });
  }
});

export { router as salesforceRoutes };

