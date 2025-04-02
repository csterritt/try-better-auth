import { Context, Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { auth } from './auth'
import { COOKIES, PATHS, VALIDATION } from '../constants'
import { redirectWithError } from '../support/redirects'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | undefined | File
}

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 * @param authRoutes - Hono instance for auth routes
 */
export const setupStartOtpHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
  authRoutes.post(PATHS.AUTH.SERVER.START_OTP, async (c: Context) => {
    try {
      const formData: FormDataType = await c.req.parseBody()
      const email = (formData.email as string | undefined) || ''

      // Store email in cookie for later use
      setCookie(c, COOKIES.EMAIL_ENTERED, email, {
        path: '/',
      })

      if (!email || typeof email !== 'string') {
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Email is required',
          {
            [COOKIES.EMAIL_ENTERED]: email,
          }
        )
      }

      // Validate email format
      if (!VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Please enter a valid email address',
          { [COOKIES.EMAIL_ENTERED]: email }
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
        console.error('Error response:', responseText)
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Failed to send OTP'
        )
      }

      // Redirect to the await-code page
      return c.redirect(
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        302
      )
    } catch (error) {
      console.error('Start OTP error:', error)
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
        'Failed to start OTP process'
      )
    }
  })
}
