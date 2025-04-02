import { Context, Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { COOKIES, PATHS } from '../constants'

/**
 * Cancel OTP verification process
 * Clears the email cookie and redirects to the home page
 * @param authRoutes - Hono instance for auth routes
 */
export const setupCancelOtpHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
  authRoutes.get(PATHS.AUTH.SERVER.CANCEL_OTP, (c: Context) => {
    // Clear the email cookie
    deleteCookie(c, COOKIES.EMAIL_ENTERED)

    // Redirect to home
    return c.redirect(PATHS.HOME, 302)
  })
}
