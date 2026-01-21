# Salesforce Connected App Setup Guide

This guide walks you through creating a Connected App in Salesforce for OAuth 2.0 authentication.

## Prerequisites

- Access to a Salesforce org (Production, Sandbox, or Developer)
- Admin permissions (or ability to create Connected Apps)

## Step-by-Step Instructions

### 1. Navigate to Connected Apps

1. Log in to your Salesforce org
2. Click the **Setup** gear icon (⚙️) in the top right
3. In the Quick Find box, type "App Manager"
4. Click **App Manager**

### 2. Create New Connected App

1. Click **New Connected App** button (top right)
2. Fill in the **Basic Information**:
   - **Connected App Name**: `Salesforce Metadata Tracker`
   - **API Name**: `Salesforce_Metadata_Tracker` (auto-filled)
   - **Contact Email**: Your email address
   - **Description** (optional): `Connected App for Metadata Tracker Tool`

### 3. Enable OAuth Settings

1. Scroll down to **API (Enable OAuth Settings)** section
2. Check the box **Enable OAuth Settings** ✅

### 4. Configure OAuth Settings

**Callback URL:**
- For **Development**: `http://localhost:5000/api/auth/callback`
- For **Production**: `https://yourdomain.com/api/auth/callback`

**Selected OAuth Scopes:**
Move the following scopes from **Available OAuth Scopes** to **Selected OAuth Scopes**:

1. ✅ **Access and manage your data (api)**
   - Allows the app to access and manage your Salesforce data

2. ✅ **Perform requests on your behalf at any time (refresh_token, offline_access)**
   - Allows the app to refresh access tokens without user interaction
   - Enables long-lived sessions

**Note**: Do NOT select "Full access (full)" unless absolutely necessary. The selected scopes provide sufficient access for metadata operations.

### 5. Additional Settings (Optional)

**Require Secret for Web Server Flow**: ✅ (Recommended - keep checked)

**Require Secret for Refresh Token Flow**: ✅ (Recommended - keep checked)

**Enable Client Credentials Flow**: ❌ (Not needed for this use case)

### 6. Save the Connected App

1. Click **Save** at the bottom
2. Salesforce will display a warning about callback URLs - click **Continue**

### 7. Retrieve Credentials

After saving, you'll see the Connected App detail page:

1. **Consumer Key** (Client ID)
   - Copy this value - you'll need it for `SF_CLIENT_ID` in `.env`

2. **Consumer Secret** (Client Secret)
   - Click **Click to reveal** to see the secret
   - Copy this value - you'll need it for `SF_CLIENT_SECRET` in `.env`
   - ⚠️ **Important**: This is only shown once. Save it securely!

### 8. Configure IP Restrictions (Optional but Recommended)

1. Scroll to **IP Relaxation** section
2. Select **Relax IP restrictions** (for development)
   - Or configure specific IP ranges for production

### 9. Configure Permitted Users (Optional)

1. Scroll to **Permitted Users** section
2. Select one of:
   - **All users may self-authorize** (for testing)
   - **Admin approved users are pre-authorized** (for production)

### 10. Update Environment Variables

Add the credentials to your `server/.env` file:

```env
SF_CLIENT_ID=3MVG9...your_consumer_key_here
SF_CLIENT_SECRET=ABC123...your_consumer_secret_here
SF_CALLBACK_URL=http://localhost:5000/api/auth/callback
```

## Verification Checklist

- [ ] Connected App created successfully
- [ ] OAuth Settings enabled
- [ ] Callback URL configured correctly
- [ ] OAuth scopes selected (api, refresh_token, offline_access)
- [ ] Consumer Key copied
- [ ] Consumer Secret copied and saved securely
- [ ] Environment variables configured
- [ ] Application tested with login flow

## Security Best Practices

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Rotate secrets periodically** - Regenerate Consumer Secret if compromised
3. **Use IP restrictions in production** - Limit access to known IPs
4. **Monitor OAuth usage** - Check Setup → OAuth and OpenID Connect → Connected Apps Usage
5. **Use least privilege** - Only select necessary OAuth scopes

## Troubleshooting

### "Invalid redirect_uri" Error

- Ensure the callback URL in Connected App **exactly matches** `SF_CALLBACK_URL` in `.env`
- Check for:
  - Trailing slashes
  - HTTP vs HTTPS
  - Port numbers
  - Case sensitivity

### "Invalid client credentials" Error

- Verify `SF_CLIENT_ID` matches Consumer Key
- Verify `SF_CLIENT_SECRET` matches Consumer Secret (no extra spaces)
- Ensure Connected App is active (not deleted)

### "Insufficient access rights" Error

- Verify OAuth scopes are selected correctly
- Check user has permission to use Connected App
- Verify "Permitted Users" setting allows your user

## Multiple Environments

If you need different Connected Apps for different environments:

1. **Development**: Use localhost callback URL
2. **Staging**: Use staging domain callback URL
3. **Production**: Use production domain callback URL

Each environment should have its own Connected App or use environment-specific callback URLs.

## Next Steps

After setting up the Connected App:

1. Configure environment variables
2. Start the application: `npm run dev`
3. Test the login flow
4. Verify authentication works correctly

See `README.md` for application setup instructions.

