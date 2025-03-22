import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'

// Check if we're in production (for cookie security)
// Using process.env.NODE_ENV as a more standard approach
const isProduction = process.env.NODE_ENV === 'production'

// Create the Better Auth instance with the simplest configuration
export const auth = betterAuth({
  // Use memory adapter for now to simplify testing
  adapter: 'memory',
  
  // Enable Email OTP authentication
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // For now, just log the values
        console.log(`Email: ${email}, OTP: ${otp}, Type: ${type}`)
      },
    }),
  ],
  
  // Set up session options with cookie options
  cookies: {
    secure: isProduction,
    sameSite: 'lax',
    httpOnly: true,
  },
})
