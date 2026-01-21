import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authRoutes } from './routes/auth.js';
import { salesforceRoutes } from './routes/salesforce.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: true, // Changed to true to save session even if not modified
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cookies on cross-site redirects (OAuth callback)
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/salesforce', salesforceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check OAuth configuration
app.get('/api/debug/oauth-config', (req, res) => {
  res.json({
    callbackUrl: process.env.SF_CALLBACK_URL || 'http://localhost:5000/api/auth/callback',
    clientId: process.env.SF_CLIENT_ID ? `${process.env.SF_CLIENT_ID.substring(0, 10)}...` : 'Not set',
    hasClientSecret: !!process.env.SF_CLIENT_SECRET,
    port: PORT,
    frontendUrl: FRONTEND_URL
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔐 Callback URL: ${process.env.SF_CALLBACK_URL || 'http://localhost:5000/api/auth/callback'}`);
});

