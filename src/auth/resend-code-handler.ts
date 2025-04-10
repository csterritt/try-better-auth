import { Context, Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { auth } from './auth'
import { COOKIES, PATHS, VALIDATION, TIME_LIMITS } from '../constants'
import { redirectWithError, redirectWithMessage } from '../support/redirects'
import { decrypt, encrypt } from './crypto-utils'
import { OtpSetupData, FormDataType } from './auth-types'

/**
 * Resend OTP code
 * Similar to START_OTP but redirects back to AWAIT_CODE page with message
 * @param authRoutes - Hono instance for auth routes
 */
export const setupResendCodeHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
  authRoutes.post(PATHS.AUTH.SERVER.RESEND_CODE, async (c: Context) => {
    try {
      const formData: FormDataType = await c.req.parseBody()
      const email = formData.email as string

      console.log(`RESEND_CODE invoked for email: ${email}`)

      // Validate email format
      if (!email || !VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
        setCookie(c, COOKIES.EMAIL_ENTERED, email || '')
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address'
        )
      }

      // Check if OTP_SETUP cookie exists
      const otpSetupCookie = getCookie(c, COOKIES.OTP_SETUP)
      if (!otpSetupCookie) {
        console.error('OTP_SETUP cookie not found')
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address'
        )
      }

      // Check if encryption key is available
      if (!process.env.ENCRYPT_KEY) {
        console.error('ENCRYPT_KEY is not defined in environment variables')
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address'
        )
      }

      // Decrypt the cookie value
      try {
        const decryptedData = decrypt(otpSetupCookie, process.env.ENCRYPT_KEY)
        if (!decryptedData) {
          console.error('Failed to decrypt OTP_SETUP cookie')
          return redirectWithError(
            c,
            PATHS.AUTH.SERVER.SIGN_IN,
            'Please enter a valid email address'
          )
        }

        // Parse the OTP setup data
        const otpSetupData = JSON.parse(decryptedData) as OtpSetupData
        const setupTime = otpSetupData.time
        const currentTime = Date.now()
        const elapsedSeconds = Math.floor((currentTime - setupTime) / 1000)

        if (elapsedSeconds < TIME_LIMITS.MIN_TIME_BETWEEN_REQUESTS) {
          const remainingSeconds =
            TIME_LIMITS.MIN_TIME_BETWEEN_REQUESTS - elapsedSeconds
          setCookie(c, COOKIES.EMAIL_ENTERED, email)
          return redirectWithMessage(
            c,
            `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
            `Please wait another ${remainingSeconds} seconds before asking for another code, to give time for the email to arrive.`
          )
        }
      } catch (error) {
        console.error('Error processing OTP_SETUP cookie:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address'
        )
      }

      // Create a request to the Better Auth API with JSON body
      const url = new URL(PATHS.AUTH.CLIENT.SEND_OTP, c.req.url)

      // Convert headers to an object
      const headerEntries: [string, string][] = []
      c.req.raw.headers.forEach((value, key) => {
        headerEntries.push([key, value])
      })

      const req = new Request(url.toString(), {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headerEntries),
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.env.CLIENT_PERMISSION}`,
        },
        body: JSON.stringify({
          email,
          type: 'sign-in',
        }),
      })

      // Call the Better Auth handler
      const response = await auth.handler(req)

      // Check if the request was successful
      if (response.status !== 200) {
        const responseText = await response.text()
        console.error('Error resending OTP:', responseText)
        setCookie(c, COOKIES.EMAIL_ENTERED, email)
        return redirectWithError(
          c,
          `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
          'Failed to resend verification code'
        )
      }

      setCookie(c, COOKIES.EMAIL_ENTERED, email)
      try {
        // Create OTP setup data object with current time and reset code attempts
        const otpSetupData: OtpSetupData = {
          time: Date.now(),
          codeAttempts: 0,
        }
        setCookie(
          c,
          COOKIES.OTP_SETUP,
          encrypt(JSON.stringify(otpSetupData), process.env.ENCRYPT_KEY)
        )
      } catch (error) {
        console.error('Error setting new OTP_SETUP cookie:', error)
        // Continue without updating the cookie
      }

      // Redirect back to await-code page with success message
      return redirectWithMessage(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'Code sent! Please check your email (including spam folder).'
      )
    } catch (error) {
      console.error('Error resending OTP:', error)
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
        'Failed to resend code'
      )
    }
  })
}
