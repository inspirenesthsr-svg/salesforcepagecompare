import crypto from 'crypto';

/**
 * Generate a cryptographically random code verifier for PKCE
 * @returns {string} Code verifier (43-128 characters)
 */
export function generateCodeVerifier() {
  // Generate 32 random bytes and base64url encode
  const randomBytes = crypto.randomBytes(32);
  return base64UrlEncode(randomBytes);
}

/**
 * Generate code challenge from code verifier using S256 method
 * @param {string} codeVerifier - The code verifier
 * @returns {string} Code challenge (base64url encoded SHA256 hash)
 */
export function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64UrlEncode(hash);
}

/**
 * Base64 URL-safe encoding (RFC 4648)
 * @param {Buffer} buffer - Buffer to encode
 * @returns {string} Base64url encoded string
 */
function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

