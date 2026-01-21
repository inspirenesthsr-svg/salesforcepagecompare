# Enabling Connected App Creation in Salesforce

## Why "New Connected App" is Disabled

The "New Connected App" option is disabled when your user profile doesn't have the necessary permissions. This is a security feature in Salesforce.

## Required Permissions

To create Connected Apps, you need one of the following:

### Option 1: System Administrator Profile
- **Profile**: System Administrator
- **Permission**: Automatically has all permissions

### Option 2: Custom Profile with Required Permissions
Your profile needs:
- **Manage Connected Apps** permission
- **Create and Customize Applications** permission

## How to Enable Connected App Creation

### Method 1: Request Admin Access (Recommended)

1. **Contact your Salesforce Administrator**
   - Ask them to either:
     - Grant you System Administrator profile (temporary or permanent)
     - OR add "Manage Connected Apps" permission to your profile

2. **What to tell your admin:**
   ```
   I need to create a Connected App for OAuth authentication. 
   Please grant me one of:
   - System Administrator profile (temporary is fine)
   - OR "Manage Connected Apps" permission on my profile
   ```

### Method 2: Check Your Current Profile

1. Go to **Setup** (gear icon)
2. In Quick Find, type "Users"
3. Click **Users**
4. Find your user and click on it
5. Check your **Profile** name
6. If it's not "System Administrator", you'll need admin help

### Method 3: Use an Existing Connected App

If you can't create a new one, you can:
- Use an existing Connected App (if you have access)
- Ask an admin to create one for you with your specifications

## Alternative: Ask Admin to Create It

If you can't get permissions, provide your admin with these details:

### Connected App Configuration

**Basic Information:**
- **Connected App Name**: Salesforce Metadata Tracker
- **API Name**: Salesforce_Metadata_Tracker
- **Contact Email**: [Your Email]

**OAuth Settings:**
- ✅ Enable OAuth Settings
- **Callback URL**: `http://localhost:5000/api/auth/callback`
- **Selected OAuth Scopes**:
  - Access and manage your data (api)
  - Perform requests on your behalf at any time (refresh_token, offline_access)

**Additional Settings:**
- ✅ Require Secret for Web Server Flow
- ✅ Require Secret for Refresh Token Flow
- **IP Relaxation**: Relax IP restrictions (for development)

**Permitted Users:**
- All users may self-authorize (for testing)
- OR Admin approved users are pre-authorized (for production)

### What You Need from Admin

After the Connected App is created, ask for:
1. **Consumer Key** (Client ID)
2. **Consumer Secret** (Client Secret)

## Step-by-Step: If You Get Admin Access

Once you have the permissions:

1. **Navigate to App Manager**
   - Setup → App Manager

2. **Click "New Connected App"**
   - This button should now be enabled

3. **Fill in Basic Information**
   - Connected App Name: `Salesforce Metadata Tracker`
   - API Name: `Salesforce_Metadata_Tracker` (auto-filled)
   - Contact Email: Your email

4. **Enable OAuth Settings**
   - Check "Enable OAuth Settings"
   - Callback URL: `http://localhost:5000/api/auth/callback`
   - Selected OAuth Scopes:
     - Move "Access and manage your data (api)" to Selected
     - Move "Perform requests on your behalf at any time (refresh_token, offline_access)" to Selected

5. **Save**
   - Click Save
   - Click Continue on the warning (if shown)

6. **Get Credentials**
   - Copy the Consumer Key (Client ID)
   - Click "Click to reveal" and copy Consumer Secret
   - ⚠️ Save these securely - you'll need them for your `.env` file

## Quick Checklist for Admin

If you're providing this to an admin, here's what they need to do:

- [ ] Create new Connected App
- [ ] Name: "Salesforce Metadata Tracker"
- [ ] Enable OAuth Settings
- [ ] Set Callback URL: `http://localhost:5000/api/auth/callback`
- [ ] Select OAuth Scopes: `api` and `refresh_token offline_access`
- [ ] Save and provide Consumer Key and Consumer Secret

## Troubleshooting

### "I still can't see the button"
- Clear browser cache
- Log out and log back in
- Verify permissions were actually granted
- Try a different browser

### "I have System Admin but still disabled"
- Check if your org has Connected App creation restricted
- Some orgs restrict this to specific users
- Contact Salesforce Support if needed

### "Can I use a Sandbox instead?"
- Yes! Sandboxes often have fewer restrictions
- You can create the Connected App in a Sandbox
- Use the same configuration

## Using a Sandbox (Alternative)

If your Production org restricts Connected App creation:

1. **Use a Developer/Sandbox Org**
   - Sandboxes often allow Connected App creation
   - Create the Connected App there
   - Use the same OAuth configuration

2. **Test in Sandbox First**
   - This is actually recommended for development
   - Once working, you can create in Production

## Next Steps

Once you have the Connected App created (by you or admin):

1. Update your `server/.env` file:
   ```env
   SF_CLIENT_ID=your_consumer_key_here
   SF_CLIENT_SECRET=your_consumer_secret_here
   SF_CALLBACK_URL=http://localhost:5000/api/auth/callback
   ```

2. Restart your server

3. Test the login flow

## Security Note

- Never share your Consumer Secret publicly
- Keep it in `.env` file (which is gitignored)
- Rotate secrets if compromised
- Use different Connected Apps for dev/staging/production

