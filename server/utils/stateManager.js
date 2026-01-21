import crypto from 'crypto';

/**
 * Generate a random state token for CSRF protection
 * @returns {string} Random state token
 */
export function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate state parameter against stored state
 * @param {string} storedState - State stored in session
 * @param {string} receivedState - State received from callback
 * @returns {boolean} True if valid
 */
export function validateState(storedState, receivedState) {
  if (!storedState || !receivedState) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedState),
    Buffer.from(receivedState)
  );
}

