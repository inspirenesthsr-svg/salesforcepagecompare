import express from 'express';
import { exchangeCodeForToken, getLoginUrl, refreshAccessToken, getAuthStatus, logout, getLogoutUrl } from '../services/authService.js';
import { generateState, validateState } from '../utils/stateManager.js';

const router = express.Router();

/**
 * GET /api/auth/login-url
 * Generate Salesforce OAuth login URL with state parameter and PKCE
 */
router.get('/login-url', async (req, res) => {
  try {
    const { orgType = 'production', customDomain } = req.query;
    
    // Generate CSRF state token
    const state = generateState();
    req.session.oauthState = state;
    
    // Generate login URL with PKCE
    const { loginUrl, codeVerifier } = getLoginUrl(orgType, customDomain, state);
    
    // Store code verifier in session (critical for PKCE)
    req.session.codeVerifier = codeVerifier;
    req.session.orgType = orgType; // Store org type too
    
    // Force session save before responding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          reject(err);
        } else {
          console.log('✅ Session saved - Code verifier stored (length:', codeVerifier.length, ')');
          console.log('✅ Session ID:', req.sessionID);
          console.log('✅ Code verifier preview:', codeVerifier.substring(0, 20) + '...');
          resolve();
        }
      });
    });
    
    res.json({
      success: true,
      data: {
        loginUrl,
        state
      }
    });
  } catch (error) {
    console.error('Error generating login URL:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_URL_ERROR',
        message: 'Failed to generate login URL',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/auth/callback
 * Handle OAuth callback from Salesforce
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Debug session
    console.log('Callback received - Session ID:', req.sessionID);
    console.log('Callback received - Session has codeVerifier:', !!req.session.codeVerifier);
    
    // Handle OAuth errors from Salesforce
    if (error) {
      console.error('OAuth error from Salesforce:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`);
    }
    
    // Validate state parameter (CSRF protection)
    if (!state || !validateState(req.session.oauthState, state)) {
      console.error('Invalid state parameter');
      console.error('Expected state in session:', !!req.session.oauthState);
      console.error('Received state:', state);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=invalid_state&description=CSRF validation failed`);
    }
    
    // Clear state from session after validation
    delete req.session.oauthState;
    
    // Validate authorization code
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=missing_code&description=Authorization code not provided`);
    }
    
    // Get PKCE code verifier from session
    const codeVerifier = req.session.codeVerifier;
    const orgType = req.session.orgType || 'production';
    
    console.log('Token exchange - Code verifier present:', !!codeVerifier);
    console.log('Token exchange - Code verifier length:', codeVerifier?.length);
    
    if (!codeVerifier) {
      console.error('❌ CRITICAL ERROR: No code_verifier in session!');
      console.error('Session keys:', Object.keys(req.session));
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=missing_code_verifier&description=PKCE code verifier not found in session. Session may have been lost.`);
    }
    
    // Clear code verifier from session after retrieving
    delete req.session.codeVerifier;
    delete req.session.orgType;
    
    // Exchange code for token with PKCE
    console.log('Exchanging code for token with PKCE...');
    const tokenData = await exchangeCodeForToken(code, codeVerifier, orgType);
    
    // Store token in session (in production, consider encrypted storage or Redis)
    req.session.accessToken = tokenData.access_token;
    req.session.instanceUrl = tokenData.instance_url;
    req.session.refreshToken = tokenData.refresh_token;
    req.session.tokenIssuedAt = tokenData.issued_at;
    req.session.userId = tokenData.id;
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    const errorMessage = error.response?.data?.error_description || error.message || 'Unknown error';
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=token_exchange_failed&description=${encodeURIComponent(errorMessage)}`);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.session.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available'
        }
      });
    }
    
    const tokenData = await refreshAccessToken(refreshToken);
    
    // Update session with new token
    req.session.accessToken = tokenData.access_token;
    req.session.instanceUrl = tokenData.instance_url;
    req.session.tokenIssuedAt = tokenData.issued_at;
    
    res.json({
      success: true,
      data: {
        accessToken: tokenData.access_token,
        instanceUrl: tokenData.instance_url,
        issuedAt: tokenData.issued_at
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh access token',
        details: error.response?.data?.error_description || error.message
      }
    });
  }
});

/**
 * GET /api/auth/status
 * Get current authentication status
 */
router.get('/status', (req, res) => {
  try {
    const status = getAuthStatus(req.session);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to get authentication status'
      }
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
router.post('/logout', (req, res) => {
  try {
    const instanceUrl = req.session.instanceUrl;
    
    // Clear local session
    logout(req.session);
    
    // Return Salesforce logout URL if available
    const salesforceLogoutUrl = getLogoutUrl(instanceUrl);
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      data: {
        salesforceLogoutUrl: salesforceLogoutUrl || null
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout'
      }
    });
  }
});

export { router as authRoutes };

