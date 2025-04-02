import { Context, Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { auth } from './auth'
import { COOKIES, PATHS } from '../constants'
import { redirectWithError, redirectWithMessage } from '../support/redirects'

/**
 * Sign out endpoint
 * Clears the session cookie and redirects to the home page
 * @param authRoutes - Hono instance for auth routes
 */
export const setupSignOutHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
  authRoutes.post(PATHS.AUTH.SERVER.SIGN_OUT, async (c: Context) => {
    try {
      // Create a request to the Better Auth API
      const url = new URL(PATHS.AUTH.CLIENT.SIGN_OUT, c.req.url)

      // Convert headers to an object
      const headerEntries: [string, string][] = []
      c.req.raw.headers.forEach((value, key) => {
        headerEntries.push([key, value])
      })

      const req = new Request(url.toString(), {
        method: 'POST',
        headers: {
          ...Object.fromEntries(headerEntries),
          Authorization: `Bearer ${c.env.CLIENT_PERMISSION}`,
        },
      })

      // Call the Better Auth handler directly
      const response = await auth.handler(req)

      // Check if the request was successful
      if (response.status !== 200) {
        const responseText = await response.text()
        console.error('Error response:', responseText)
        return redirectWithError(c, PATHS.HOME, 'Failed to sign out')
      }

      // Clear the email cookie
      deleteCookie(c, COOKIES.EMAIL_ENTERED)
      
      // Clear the OTP setup cookie
      deleteCookie(c, COOKIES.OTP_SETUP)

      // Redirect to home page with a message
      return redirectWithMessage(c, PATHS.HOME, 'Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
      return redirectWithError(c, PATHS.HOME, 'Failed to sign out')
    }
  })
}
