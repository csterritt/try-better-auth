import fs from 'fs'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins'

import { IS_PRODUCTION } from '../constants'

// Create the Better Auth instance with the simplest configuration
export const auth = betterAuth({
  // Use memory adapter for now to simplify testing
  adapter: 'memory',

  // Enable Email OTP authentication
  plugins: [
    emailOTP({
      expiresIn: 900,
      async sendVerificationOTP({ email, otp, type }) {
        // For now, just log the values
        console.log(
          `Email: ${email}, OTP: ${otp}, Type: ${type}, isProduction: ${IS_PRODUCTION}`
        )

        // Write OTP to file for development purposes only
        if (!IS_PRODUCTION) {
          try {
            fs.writeFileSync('/tmp/otp.txt', otp)
          } catch (error) {
            console.error('Error writing OTP to file:', error)
          }
        }
      },
    }),
  ],

  // Set up session options with cookie options
  cookies: {
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    httpOnly: true,
  },
})
