# Testing OAuth Login Flow

## Pre-Test Checklist

✅ **Connected App Configuration:**
- Callback URL in Salesforce: `http://localhost:5000/api/auth/callback`
- OAuth Scopes: `api` and `refresh_token offline_access`
- Consumer Key matches `SF_CLIENT_ID` in `.env`
- Consumer Secret matches `SF_CLIENT_SECRET` in `.env`

✅ **Environment Variables:**
- `SF_CLIENT_ID`: Set ✓
- `SF_CLIENT_SECRET`: Set ✓
- `SF_CALLBACK_URL`: `http://localhost:5000/api/auth/callback` ✓
- `FRONTEND_URL`: `http://localhost:3000` ✓

## Step-by-Step Test

### Step 1: Start the Servers

Open a terminal and run:
```bash
npm run dev
```

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Step 2: Verify Server is Running

Check the console output. You should see:
```
🚀 Server running on port 5000
📡 Frontend URL: http://localhost:3000
🔐 Callback URL: http://localhost:5000/api/auth/callback
```

### Step 3: Check OAuth Configuration

Visit in your browser:
```
http://localhost:5000/api/debug/oauth-config
```

This will show:
- The callback URL being used
- Whether Client ID and Secret are configured
- Current port and frontend URL

### Step 4: Test Login Flow

1. **Open the frontend:**
   ```
   http://localhost:3000
   ```

2. **Click "Login with Salesforce"**

3. **Select org type:**
   - Production/Developer Org
   - OR Sandbox

4. **You should be redirected to Salesforce login page**

5. **Enter your Salesforce credentials**

6. **Authorize the app** (click "Allow")

7. **You should be redirected back to:**
   ```
   http://localhost:3000/auth/success
   ```

### Step 5: Verify Authentication

After successful login:
- You should see "Authentication Successful" message
- You'll be redirected to the dashboard
- The dashboard should show your authentication status

## Troubleshooting

### If you get "redirect_uri_mismatch":

1. **Double-check Connected App:**
   - Go to Setup → App Manager → Your Connected App → Edit
   - Verify Callback URL is exactly: `http://localhost:5000/api/auth/callback`
   - No trailing slash
   - `http://` not `https://`
   - Includes port `:5000`

2. **Verify .env file:**
   ```bash
   # Should match exactly
   SF_CALLBACK_URL=http://localhost:5000/api/auth/callback
   ```

3. **Restart server** after any changes

### If you get "invalid_client":

- Check `SF_CLIENT_ID` matches Consumer Key
- Check `SF_CLIENT_SECRET` matches Consumer Secret
- No extra spaces or quotes in .env file

### If callback doesn't work:

1. **Check server is running on port 5000:**
   ```bash
   # In another terminal
   netstat -ano | findstr :5000
   ```

2. **Check browser console** for errors

3. **Check server logs** for errors

### If you see CORS errors:

- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check server console for CORS configuration

## Expected Flow

```
User clicks "Login with Salesforce"
    ↓
Frontend → GET /api/auth/login-url
    ↓
Backend generates OAuth URL with callback
    ↓
User redirected to Salesforce
    ↓
User logs in and authorizes
    ↓
Salesforce redirects to: http://localhost:5000/api/auth/callback?code=...
    ↓
Backend exchanges code for token
    ↓
Backend redirects to: http://localhost:3000/auth/success
    ↓
Frontend shows success and redirects to dashboard
```

## Success Indicators

✅ No errors in browser console
✅ No errors in server logs
✅ Redirected to Salesforce login
✅ After authorization, redirected back to app
✅ Dashboard shows authenticated status
✅ Can see instance URL and user ID

## Next Steps After Successful Login

Once authentication works:
- You'll have an access token stored in session
- You can make API calls to Salesforce
- Ready for Phase 2: Metadata Capture

