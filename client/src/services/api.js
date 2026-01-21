import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getLoginUrl: async (orgType, customDomain) => {
    const params = new URLSearchParams();
    if (orgType) params.append('orgType', orgType);
    if (customDomain) params.append('customDomain', customDomain);
    
    const response = await apiClient.get(`/auth/login-url?${params.toString()}`);
    return response;
  },

  getStatus: async () => {
    const response = await apiClient.get('/auth/status');
    return response;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response;
  }
};

export const salesforceAPI = {
  getObjects: async (namespace = 'leaseworks__') => {
    const response = await apiClient.get(`/salesforce/objects?namespace=${namespace}`);
    return response;
  },

  selectObject: async (apiName, label) => {
    const response = await apiClient.post('/salesforce/objects/select', {
      apiName,
      label
    });
    return response;
  },

  getSelectedObject: async () => {
    const response = await apiClient.get('/salesforce/objects/selected');
    return response;
  },

  getRecords: async (objectName, limit = 50, offset = 0) => {
    const response = await apiClient.get(`/salesforce/objects/${objectName}/records?limit=${limit}&offset=${offset}`);
    return response;
  },

  captureRecord: async (recordId, recordUrl) => {
    const response = await apiClient.post(`/salesforce/records/${recordId}/capture`, {
      recordUrl
    });
    return response;
  },

  getCapturedRecords: async () => {
    const response = await apiClient.get('/salesforce/records/captured');
    return response;
  },

  setUpgradeState: async (upgradeState) => {
    const response = await apiClient.post('/salesforce/upgrade-state', {
      upgradeState
    });
    return response;
  },

  getUpgradeState: async () => {
    const response = await apiClient.get('/salesforce/upgrade-state');
    return response;
  },

  compareRecord: async (recordId, objectApiName) => {
    const response = await apiClient.post(`/salesforce/records/${recordId}/compare`, {
      objectApiName
    });
    return response;
  }
};

export default apiClient;

