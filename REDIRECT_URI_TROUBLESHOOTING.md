# Redirect URI Mismatch - Troubleshooting Guide

## Error: `redirect_uri_mismatch`

This error occurs when the callback URL in your Salesforce Connected App doesn't **exactly match** the callback URL being sent in the OAuth request.

## Current Configuration

Your application is configured to use:
```
http://localhost:5000/api/auth/callback
```

## Step-by-Step Fix

### Step 1: Verify Your Connected App Callback URL

1. Log in to your Salesforce org
2. Go to **Setup** → **App Manager**
3. Find your Connected App (Salesforce Metadata Tracker)
4. Click the dropdown arrow → **View** or **Edit**
5. Scroll to **API (Enable OAuth Settings)** section
6. Check the **Callback URL** field

### Step 2: Ensure Exact Match

The callback URL in Salesforce must **exactly match** one of these:

**For Development:**
```
http://localhost:5000/api/auth/callback
```

**Important Notes:**
- ✅ Must be `http://` (not `https://`) for localhost
- ✅ Must include the port number `:5000`
- ✅ Must include the full path `/api/auth/callback`
- ✅ No trailing slash
- ✅ Case-sensitive (lowercase)

### Step 3: Common Mistakes to Avoid

❌ **Wrong:**
- `https://localhost:5000/api/auth/callback` (https instead of http)
- `http://localhost:5000/api/auth/callback/` (trailing slash)
- `http://localhost:5000/callback` (missing /api/auth)
- `http://127.0.0.1:5000/api/auth/callback` (IP instead of localhost)
- `http://LOCALHOST:5000/api/auth/callback` (uppercase)

✅ **Correct:**
- `http://localhost:5000/api/auth/callback`

### Step 4: Update Connected App

1. In your Connected App, click **Edit**
2. Scroll to **Callback URL**
3. **Add** or **Update** the callback URL to:
   ```
   http://localhost:5000/api/auth/callback
   ```
4. Click **Save**

### Step 5: Multiple Callback URLs

Salesforce allows multiple callback URLs. You can add:
- `http://localhost:5000/api/auth/callback` (for development)
- `https://yourdomain.com/api/auth/callback` (for production)

Just make sure each URL is on a separate line.

### Step 6: Verify Environment Variable

Check your `.env` file has the correct URL:

```bash
# In server/.env
SF_CALLBACK_URL=http://localhost:5000/api/auth/callback
```

### Step 7: Restart Your Server

After making changes:
1. Stop your server (Ctrl+C)
2. Restart: `npm run dev`
3. Clear browser cache/cookies
4. Try logging in again

## Debug: Check What URL is Being Sent

You can check the actual URL being sent by looking at the browser's network tab:

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Click "Login with Salesforce"
4. Look for the request to Salesforce
5. Check the `redirect_uri` parameter in the URL

It should show:
```
redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fcallback
```
(URL-encoded version of `http://localhost:5000/api/auth/callback`)

## Alternative: Use a Different Port

If you're having issues with port 5000, you can:

1. Change the port in `server/.env`:
   ```
   PORT=3001
   SF_CALLBACK_URL=http://localhost:3001/api/auth/callback
   ```

2. Update the Connected App callback URL to match

3. Restart the server

## Still Having Issues?

1. **Double-check the Connected App** - Make sure you saved the changes
2. **Check for typos** - Copy-paste the exact URL
3. **Verify the port** - Make sure your server is running on port 5000
4. **Check firewall** - Make sure localhost:5000 is accessible
5. **Try incognito mode** - Clear browser cache/cookies

## Production Setup

For production, you'll need:
- HTTPS callback URL
- Update `SF_CALLBACK_URL` in production environment
- Add production callback URL to Connected App

Example:
```
https://yourapp.com/api/auth/callback
```

