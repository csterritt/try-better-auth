import { createAuthClient } from 'better-auth/client'
import { emailOTPClient } from 'better-auth/client/plugins'

// Initialize the Better Auth client
export const authClient = createAuthClient({
  // Define the base URL for our authentication API with hardcoded localhost URL
  baseURL: 'http://localhost:3000/api/auth',
  
  // Include the required plugins
  plugins: [emailOTPClient()],
})

/**
 * Client-side authentication functions for interacting with the Better Auth API
 */

// Send a verification OTP to the specified email address
export const sendOTP = async (email: string): Promise<boolean> => {
  try {
    // Use the Email OTP client to send a verification code
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    })
    
    // Check if the request was successful
    return !error
  } catch (error) {
    console.error('Error sending OTP:', error)
    return false
  }
}

// Verify the OTP and sign in the user
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    // Use the Email OTP client to verify and sign in
    const { error } = await authClient.signIn.emailOtp({
      email,
      otp,
    })
    
    // Check if the sign-in was successful
    return !error
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return false
  }
}

// Sign out the current user
export const signOut = async (): Promise<boolean> => {
  try {
    // Use the auth client to sign out
    const { error } = await authClient.signOut()
    
    // Check if the sign-out was successful
    return !error
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}
