# Fixing OAuth 400 Error for Sandbox

## The Problem

You're getting a `400 Bad Request` when trying to authenticate with a **Sandbox** org. The error occurs at:
```
https://test.salesforce.com/services/oauth2/authorize
```

## Root Cause

The Connected App in your **Sandbox** org doesn't have the callback URL configured, or it doesn't match exactly.

## Important: Sandbox vs Production Connected Apps

⚠️ **Each Salesforce org (Production, Sandbox, Developer) has its own Connected Apps!**

- If you created/updated the Connected App in **Production**, it won't work for **Sandbox**
- You need to configure the Connected App **in the Sandbox org** separately

## Solution: Configure Connected App in Sandbox

### Step 1: Log into Your Sandbox

1. Go to your sandbox URL (e.g., `https://test.salesforce.com` or your custom sandbox domain)
2. Log in with your sandbox credentials

### Step 2: Update Connected App in Sandbox

1. **Setup** → **App Manager**
2. Find your Connected App (or create one if it doesn't exist)
3. Click **Edit** (or **View** → **Edit**)
4. Scroll to **API (Enable OAuth Settings)**
5. **Callback URL** must be exactly:
   ```
   http://localhost:5000/api/auth/callback
   ```
6. **OAuth Scopes** (Selected):
   - ✅ Access and manage your data (api)
   - ✅ Perform requests on your behalf at any time (refresh_token, offline_access)
7. Click **Save**

### Step 3: Verify Consumer Key/Secret

**Important:** The Consumer Key and Secret might be **different** in Sandbox vs Production!

1. After saving, check the **Consumer Key** (Client ID)
2. Check if it matches your `.env` file
3. If different, update `SF_CLIENT_ID` in `server/.env`
4. Get the **Consumer Secret** and update `SF_CLIENT_SECRET` if needed

### Step 4: Test Again

1. Restart your server
2. Try logging in with "Sandbox" selected
3. Should work now!

## Alternative: Use Production Org

If you don't want to configure the sandbox:

1. Select **"Production / Developer Org"** instead of Sandbox
2. Use the Connected App you already configured in Production
3. Make sure the callback URL matches in Production Connected App

## Quick Checklist

For **Sandbox** login to work:
- [ ] Connected App exists in Sandbox org
- [ ] Callback URL: `http://localhost:5000/api/auth/callback`
- [ ] OAuth Scopes: `api` and `refresh_token offline_access`
- [ ] `SF_CLIENT_ID` matches Sandbox Consumer Key
- [ ] `SF_CLIENT_SECRET` matches Sandbox Consumer Secret

## Debugging

Check what URL is being generated:
1. Open browser console (F12)
2. Click "Login with Salesforce"
3. Look for the console.log output showing the OAuth URL
4. Verify the `redirect_uri` parameter matches your Connected App

## Common Issues

### "I updated Production but Sandbox still fails"
- ✅ **Solution:** Update the Connected App in Sandbox separately

### "Consumer Key is different"
- ✅ **Solution:** Each org has its own Consumer Key/Secret. Update `.env` with Sandbox values

### "I don't have access to Sandbox Connected Apps"
- ✅ **Solution:** Ask your admin, or use Production org instead

## Testing Both Orgs

You can test with both:
1. **Production:** Use Production Connected App
2. **Sandbox:** Use Sandbox Connected App (with its own Consumer Key/Secret)

Just make sure your `.env` has the correct credentials for the org type you're testing!

