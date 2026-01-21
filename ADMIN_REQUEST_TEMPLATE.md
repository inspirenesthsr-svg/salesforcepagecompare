# Request Template for Salesforce Administrator

Copy and send this to your Salesforce Administrator:

---

**Subject: Request to Create Connected App for Development Tool**

Hi [Admin Name],

I'm developing a Salesforce Metadata Tracker tool and need a Connected App created for OAuth 2.0 authentication.

**Requested Configuration:**

**Connected App Details:**
- **Name**: Salesforce Metadata Tracker
- **API Name**: Salesforce_Metadata_Tracker
- **Contact Email**: [Your Email]

**OAuth Settings:**
- Enable OAuth Settings: ✅ Yes
- **Callback URL**: `http://localhost:5000/api/auth/callback`
- **OAuth Scopes** (move these to Selected):
  - Access and manage your data (api)
  - Perform requests on your behalf at any time (refresh_token, offline_access)

**Additional Settings:**
- Require Secret for Web Server Flow: ✅ Yes
- Require Secret for Refresh Token Flow: ✅ Yes
- IP Relaxation: Relax IP restrictions (for local development)
- Permitted Users: All users may self-authorize (or Admin approved, your preference)

**What I Need:**
After creation, please provide:
1. Consumer Key (Client ID)
2. Consumer Secret (Client Secret)

**Purpose:**
This Connected App will be used for OAuth authentication to access Salesforce APIs (Metadata API, Tooling API, UI API, REST API) for a metadata comparison tool.

**Security:**
- This is for development/testing purposes
- The Consumer Secret will be stored securely in environment variables (not in code)
- For production, we can create a separate Connected App with stricter settings

Thank you!

---

**Alternative: Permission Request**

If you prefer, I can create it myself. I would need:
- "Manage Connected Apps" permission added to my profile
- OR temporary System Administrator access

Let me know which approach you prefer.

---

