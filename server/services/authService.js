import axios from 'axios';
import dotenv from 'dotenv';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce.js';

dotenv.config();

const CLIENT_ID = process.env.SF_CLIENT_ID;
const CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const CALLBACK_URL = process.env.SF_CALLBACK_URL || 'http://localhost:5000/api/auth/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('⚠️  Warning: SF_CLIENT_ID or SF_CLIENT_SECRET not set in environment variables');
}

/**
 * Get Salesforce login domain based on org type
 */
function getLoginDomain(orgType, customDomain) {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  
  switch (orgType) {
    case 'sandbox':
    case 'test':
      return 'https://test.salesforce.com';
    case 'production':
    case 'developer':
    default:
      return 'https://login.salesforce.com';
  }
}

/**
 * Get token endpoint based on org type
 */
function getTokenEndpoint(orgType, customDomain) {
  if (customDomain) {
    return `https://${customDomain}/services/oauth2/token`;
  }
  
  switch (orgType) {
    case 'sandbox':
    case 'test':
      return 'https://test.salesforce.com/services/oauth2/token';
    case 'production':
    case 'developer':
    default:
      return 'https://login.salesforce.com/services/oauth2/token';
  }
}

/**
 * Generate Salesforce OAuth login URL with PKCE
 * @param {string} orgType - 'production', 'sandbox', or 'developer'
 * @param {string} customDomain - Optional custom Salesforce domain
 * @param {string} state - CSRF state parameter
 * @returns {Object} Object with loginUrl and codeVerifier
 */
export function getLoginUrl(orgType = 'production', customDomain = null, state = null) {
  if (!CLIENT_ID) {
    throw new Error('SF_CLIENT_ID not configured');
  }
  
  const loginDomain = getLoginDomain(orgType, customDomain);
  
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Build query parameters with PKCE
  const params = {
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'full refresh_token offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(state && { state: state })
  };
  
  const queryString = new URLSearchParams(params).toString();
  
  return {
    loginUrl: `${loginDomain}/services/oauth2/authorize?${queryString}`,
    codeVerifier: codeVerifier
  };
}

/**
 * Exchange authorization code for access token with PKCE
 * @param {string} code - Authorization code from Salesforce
 * @param {string} codeVerifier - PKCE code verifier (required)
 * @param {string} orgType - Org type for token endpoint
 * @param {string} customDomain - Optional custom domain
 * @returns {Promise<Object>} Token response
 */
export async function exchangeCodeForToken(code, codeVerifier, orgType = 'production', customDomain = null) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('SF_CLIENT_ID or SF_CLIENT_SECRET not configured');
  }
  
  if (!codeVerifier) {
    throw new Error('Code verifier is required for PKCE');
  }
  
  const tokenEndpoint = getTokenEndpoint(orgType, customDomain);
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: CALLBACK_URL,
    code_verifier: codeVerifier
  });
  
  try {
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token from previous authentication
 * @param {string} orgType - Org type for token endpoint
 * @param {string} customDomain - Optional custom domain
 * @returns {Promise<Object>} New token response
 */
export async function refreshAccessToken(refreshToken, orgType = 'production', customDomain = null) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('SF_CLIENT_ID or SF_CLIENT_SECRET not configured');
  }
  
  const tokenEndpoint = getTokenEndpoint(orgType, customDomain);
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  
  try {
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get authentication status from session
 * @param {Object} session - Express session object
 * @returns {Object} Auth status
 */
export function getAuthStatus(session) {
  if (!session.accessToken) {
    return {
      authenticated: false,
      message: 'Not authenticated'
    };
  }
  
  // Check if token is expired (Salesforce tokens typically last 2 hours)
  const issuedAt = session.tokenIssuedAt;
  const expiresIn = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  const now = Date.now();
  const expiresAt = issuedAt ? parseInt(issuedAt) + expiresIn : null;
  const isExpired = expiresAt ? now > expiresAt : false;
  
  return {
    authenticated: true,
    isExpired,
    instanceUrl: session.instanceUrl,
    hasRefreshToken: !!session.refreshToken,
    userId: session.userId,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
  };
}

/**
 * Logout and clear session
 * @param {Object} session - Express session object
 */
export function logout(session) {
  delete session.accessToken;
  delete session.instanceUrl;
  delete session.refreshToken;
  delete session.tokenIssuedAt;
  delete session.userId;
  delete session.oauthState;
  delete session.codeVerifier;
  delete session.orgType;
  delete session.selectedObject;
  delete session.capturedRecords;
  // Clear object caches
  Object.keys(session).forEach(key => {
    if (key.startsWith('objects_') || (key.startsWith('objects_') && key.endsWith('_timestamp'))) {
      delete session[key];
    }
  });
}

/**
 * Get Salesforce logout URL
 * @param {string} instanceUrl - Salesforce instance URL
 * @returns {string} Logout URL
 */
export function getLogoutUrl(instanceUrl) {
  if (!instanceUrl) {
    return null;
  }
  // Salesforce logout endpoint
  return `${instanceUrl}/secur/logout.jsp`;
}

