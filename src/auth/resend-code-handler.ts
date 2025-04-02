import { Context, Hono } from 'hono'

import { Env } from '../cf-env'
import { auth } from './auth'
import { COOKIES, PATHS, VALIDATION } from '../constants'
import { redirectWithError, redirectWithMessage } from '../support/redirects'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | undefined | File
}

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
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address',
          { [COOKIES.EMAIL_ENTERED]: email || '' }
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
        return redirectWithError(
          c,
          `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
          'Failed to resend verification code',
          { [COOKIES.EMAIL_ENTERED]: email }
        )
      }

      // Redirect back to await-code page with success message
      return redirectWithMessage(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'Code sent! Please check your email (including spam folder).',
        { [COOKIES.EMAIL_ENTERED]: email }
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
