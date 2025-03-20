// Import from Better Auth client libraries
import { createAuthClient } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

// Use a fixed origin for local development
const origin = 'http://localhost:3000';

// Initialize the Better Auth client
const authClient = createAuthClient({
  // Define the base URL for our authentication API with absolute URL
  baseURL: `${origin}/api/auth`,
  
  // Include the required plugins
  plugins: [emailOTPClient()],
});

// Define the auth client interface for the window object
interface AuthClient {
  sendOTP: (email: string) => Promise<boolean>;
  verifyOTP: (email: string, otp: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
}

// Create the implementation of our client functions
const clientImpl: AuthClient = {
  // Send a verification OTP to the specified email address
  async sendOTP(email: string): Promise<boolean> {
    try {
      // Use the Email OTP client to send a verification code
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      
      // Check if the request was successful
      return !error;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  },

  // Verify the OTP and sign in the user
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    try {
      // Use the Email OTP client to verify and sign in
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      });
      
      // Check if the sign-in was successful
      return !error;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  },

  // Sign out the current user
  async signOut(): Promise<boolean> {
    try {
      // Use the auth client to sign out
      const { error } = await authClient.signOut();
      
      // Check if the sign-out was successful
      return !error;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }
};

// Expose the auth client to the global window object
if (typeof window !== 'undefined') {
  (window as any).authClient = clientImpl;
}
