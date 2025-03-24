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
      // Start OTP verification process
      START_OTP: '/api/serv-auth/start-otp',

      // Finish OTP verification process
      FINISH_OTP: '/api/serv-auth/finish-otp',

      // Await code page
      AWAIT_CODE: '/api/serv-auth/await-code',

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

// Cookie names
export const COOKIES = {
  // Error message cookie
  ERROR_FOUND: 'ERROR_FOUND',
  // Email entered cookie
  EMAIL_ENTERED: 'EMAIL_ENTERED',
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
