# Fixing "invalid_grant" Authentication Failure with PKCE

## The Problem

After authorizing the app in Salesforce, you're getting:
```
Error: invalid_grant
error_description: authentication failure
```

This happens during the token exchange step.

## Root Causes

When PKCE is enabled in your Connected App, there are specific requirements:

1. **Code Verifier Must Match**: The `code_verifier` sent during token exchange must match the `code_challenge` sent during authorization
2. **Session Persistence**: The code_verifier must be stored and retrieved from the same session
3. **Client Secret**: When PKCE is used, some configurations don't require client_secret

## Your Connected App Configuration

Based on your settings:
- ✅ **Require Proof Key for Code Exchange (PKCE)**: Enabled
- ✅ **Require Secret for Web Server Flow**: Enabled
- ✅ **Require Secret for Refresh Token Flow**: Enabled

This means you need BOTH PKCE AND client_secret.

## Potential Issues

### Issue 1: Session Not Persisting

The code_verifier is stored in the session when generating the login URL, but might be lost when Salesforce redirects back.

**Solution**: Ensure session cookies are working properly. Check:
- Browser allows cookies
- SameSite cookie settings
- Session store is working

### Issue 2: Code Verifier Mismatch

The code_verifier stored might not match what was used to generate the code_challenge.

**Solution**: The code now includes debugging to verify this.

### Issue 3: Authorization Code Expired

Authorization codes expire quickly (usually within 10 minutes). If there's a delay, the code becomes invalid.

**Solution**: Exchange the code immediately after receiving it.

## Debugging Steps

1. **Check Server Logs**: Look for the debug messages I added:
   - "Login URL generated - Code verifier stored"
   - "Token exchange - Code verifier present"
   - "Token exchange - Adding code_verifier"

2. **Verify Session**: Check if the session ID is the same between requests

3. **Check Timing**: Make sure you're not waiting too long between authorization and token exchange

## Quick Fix to Try

If the issue persists, try disabling "Require Secret for Web Server Flow" in your Connected App (temporarily for testing):

1. Go to Connected App → Edit
2. Uncheck "Require Secret for Web Server Flow"
3. Save
4. Try logging in again

If this works, the issue is with how we're handling the client_secret with PKCE.

## Alternative: Check Code Verifier Format

The code_verifier must be:
- 43-128 characters
- URL-safe (A-Z, a-z, 0-9, -, ., _, ~)
- Base64url encoded

Our implementation should handle this correctly, but verify in the logs.

