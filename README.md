# Salesforce Metadata Tracker & Comparison Tool

A comprehensive tool for capturing, storing, and comparing Salesforce metadata before and after managed package upgrades.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+ (for future phases)
- A Salesforce org (Production, Sandbox, or Developer)
- A Salesforce Connected App configured with OAuth

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QA_Auto_1
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` and add your Salesforce Connected App credentials:
   ```env
   SF_CLIENT_ID=your_connected_app_client_id
   SF_CLIENT_SECRET=your_connected_app_client_secret
   SF_CALLBACK_URL=http://localhost:5000/api/auth/callback
   SESSION_SECRET=your_random_session_secret_here
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend React app on `http://localhost:3000`

## 🔐 Salesforce Connected App Setup

### Step 1: Create Connected App in Salesforce

1. Log in to your Salesforce org
2. Navigate to **Setup** → **App Manager** → **New Connected App**
3. Fill in the basic information:
   - **Connected App Name**: Salesforce Metadata Tracker
   - **API Name**: Salesforce_Metadata_Tracker
   - **Contact Email**: Your email

4. **Enable OAuth Settings** ✅
   - **Callback URL**: 
     - Development: `http://localhost:5000/api/auth/callback`
     - Production: `https://yourapp.com/api/auth/callback`
   - **Selected OAuth Scopes**:
     - ✅ Access and manage your data (api)
     - ✅ Perform requests on your behalf at any time (refresh_token, offline_access)

5. **Save** the Connected App

6. **Copy Credentials**:
   - **Consumer Key** (Client ID)
   - **Consumer Secret** (Client Secret) - Click "Click to reveal"

### Step 2: Configure Environment Variables

Add the credentials to `server/.env`:
```env
SF_CLIENT_ID=your_consumer_key_here
SF_CLIENT_SECRET=your_consumer_secret_here
```

### Step 3: Test the Connection

1. Start the application: `npm run dev`
2. Open `http://localhost:3000`
3. Click "Login with Salesforce"
4. Select your org type and click "Login with Salesforce"
5. You'll be redirected to Salesforce login page
6. After logging in and authorizing, you'll be redirected back to the app

## 📁 Project Structure

```
QA_Auto_1/
├── server/                 # Backend (Node.js/Express)
│   ├── routes/            # API routes
│   │   └── auth.js        # Authentication routes
│   ├── services/          # Business logic
│   │   └── authService.js # OAuth service
│   ├── middleware/        # Express middleware
│   │   └── errorHandler.js
│   ├── utils/             # Utility functions
│   │   └── stateManager.js
│   ├── index.js           # Server entry point
│   └── package.json
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── SalesforceLogin.jsx
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/        # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── AuthCallback.js
│   │   │   └── Dashboard.js
│   │   ├── context/      # React Context
│   │   │   └── AuthContext.js
│   │   ├── services/     # API services
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── ARCHITECTURE.md        # Architecture documentation
└── README.md             # This file
```

## 🔑 Authentication Flow

The application uses OAuth 2.0 Authorization Code Flow:

1. **User clicks "Login with Salesforce"**
   - Frontend requests login URL from backend
   - Backend generates CSRF state token
   - Backend returns Salesforce OAuth URL

2. **User redirected to Salesforce**
   - User enters credentials on Salesforce
   - User authorizes the Connected App
   - Salesforce redirects back with authorization code

3. **Backend exchanges code for token**
   - Backend validates CSRF state
   - Backend exchanges code for access token
   - Backend stores token in session

4. **User authenticated**
   - Frontend checks auth status
   - User can access protected routes

## 🛡️ Security Features

- ✅ **CSRF Protection**: State parameter validation
- ✅ **Secure Token Storage**: Tokens stored in HTTP-only session cookies
- ✅ **HTTPS Ready**: Secure cookies in production
- ✅ **No Credential Storage**: User credentials never stored
- ✅ **Client Secret Protection**: Secret only on backend
- ✅ **Token Refresh**: Automatic token refresh support

## 📝 API Endpoints

### Authentication

- `GET /api/auth/login-url` - Get Salesforce OAuth login URL
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Get authentication status
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and clear session

### Health Check

- `GET /api/health` - Server health check

## 🧪 Testing

### Manual Testing

1. **Test Login Flow**:
   - Start the application
   - Navigate to login page
   - Test with Production org
   - Test with Sandbox org
   - Test with custom domain

2. **Test Error Handling**:
   - Cancel authorization on Salesforce
   - Test with invalid credentials
   - Test expired tokens

3. **Test Security**:
   - Verify state parameter is validated
   - Verify tokens are not exposed in frontend
   - Verify session cookies are HTTP-only

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid redirect_uri"**
   - Ensure callback URL in Connected App matches `SF_CALLBACK_URL` in `.env`
   - Check for trailing slashes

2. **"Invalid client credentials"**
   - Verify `SF_CLIENT_ID` and `SF_CLIENT_SECRET` in `.env`
   - Ensure no extra spaces or quotes

3. **"CORS errors"**
   - Verify `FRONTEND_URL` in `.env` matches your frontend URL
   - Check that `withCredentials: true` is set in API client

4. **"Session not persisting"**
   - Ensure cookies are enabled in browser
   - Check that `httpOnly` and `secure` flags are appropriate for your environment

## 📚 Next Steps

This is Phase 1 (Authentication). Future phases will include:

- Phase 2: Metadata Capture Service
- Phase 3: Screenshot Service
- Phase 4: Comparison Engine
- Phase 5: Reporting & Visualization

See `ARCHITECTURE.md` for detailed architecture and roadmap.

## 📄 License

ISC

## 🤝 Contributing

This is a development project. See architecture documentation for implementation guidelines.

