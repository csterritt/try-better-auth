/**
 * Application constants
 * Centralized location for all path constants used throughout the application
 */

// Host URL
export const HOST = 'http://localhost:3000'

// Base paths
export const PATHS = {
  // Home page
  HOME: '/',

  // Protected page that requires authentication
  PROTECTED: '/protected',

  // Auth API paths
  AUTH: {
    // Base path for Better Auth API
    API_BASE: '/api/auth',

    // Server-side auth paths
    SERVER: {
      // Sign in page
      SIGN_IN: '/api/serv-auth/sign-in',

      // Start OTP verification process
      START_OTP: '/api/serv-auth/start-otp',

      // Finish OTP verification process
      FINISH_OTP: '/api/serv-auth/finish-otp',

      // Await code page
      AWAIT_CODE: '/api/serv-auth/await-code',

      // Cancel OTP verification
      CANCEL_OTP: '/api/serv-auth/cancel-otp',

      // Resend OTP code
      RESEND_CODE: '/api/serv-auth/resend-code',

      // Sign out
      SIGN_OUT: '/api/serv-auth/sign-out',
    },

    // Better Auth client paths
    CLIENT: {
      // Send verification OTP
      SEND_OTP: '/api/auth/email-otp/send-verification-otp',

      // Sign in with email OTP
      SIGN_IN: '/api/auth/sign-in/email-otp',

      // Sign out
      SIGN_OUT: '/api/auth/sign-out',
    },
  },
}

// Check if we're in production (for cookie security)
// Using process.env.NODE_ENV as a more standard approach
export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// Cookie names
export const COOKIES = {
  // Oridnary message cookie
  MESSAGE_FOUND: 'MESSAGE_FOUND',
  // Error message cookie
  ERROR_FOUND: 'ERROR_FOUND',
  // Email entered cookie
  EMAIL_ENTERED: 'EMAIL_ENTERED',
  // OTP setup timestamp cookie (encrypted)
  OTP_SETUP: 'OTP_SETUP',
  // Session cookie
  SESSION: 'better-auth.session_token',
  // Standard cookie options
  STANDARD_COOKIE_OPTIONS: {
    path: '/',
    httpOnly: true,
    secure: IS_PRODUCTION,
  },
}

// Validation patterns
export const VALIDATION = {
  // Email validation regex
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
}

// Default redirect paths
export const REDIRECTS = {
  // After successful authentication
  AFTER_AUTH: PATHS.PROTECTED,

  // After sign out
  AFTER_SIGN_OUT: PATHS.HOME,

  // After error
  AFTER_ERROR: PATHS.HOME,
}

// Time constants (in seconds)
export const TIME_LIMITS = {
  // Minimum time between OTP requests
  MIN_TIME_BETWEEN_REQUESTS: IS_PRODUCTION ? 60 : 2,
  // Maximum number of code attempts before requiring a new sign-in
  MAX_CODE_ATTEMPTS: 3,
}
