import { Context } from 'hono'
import { setCookie } from 'hono/cookie'

import { COOKIES, IS_PRODUCTION } from '../constants'

/**
 * Creates a cookie string with appropriate security settings
 * @param name - Cookie name
 * @param value - Cookie value
 * @returns Formatted cookie string
 */
const createCookieString = (name: string, value: string): string => {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict${IS_PRODUCTION ? '; Secure' : ''}`
}

/**
 * Helper function to redirect with a message cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param message - The message to display
 * @returns Response object with redirect and cookie
 */
export function redirectWithMessage(
  c: Context,
  redirectUrl: string,
  message: string
): Response {
  setCookie(c, COOKIES.MESSAGE_FOUND, message)
  return c.redirect(redirectUrl, 302)
}

/**
 * Helper function to redirect with an error cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param errorMessage - The error message to display
 * @returns Response object with redirect and cookie
 */
export function redirectWithError(
  c: Context,
  redirectUrl: string,
  errorMessage: string
): Response {
  setCookie(c, COOKIES.ERROR_FOUND, errorMessage)
  return c.redirect(redirectUrl, 302)
}
