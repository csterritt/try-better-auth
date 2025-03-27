import { Context } from 'hono'
import { COOKIES } from '../constants'

/**
 * Helper function to redirect with a message cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param message - The message to display
 * @param additionalCookies - Optional additional cookies to include
 * @returns Response object with redirect and cookie
 */
export function redirectWithMessage(
  c: Context,
  redirectUrl: string,
  message: string,
  additionalCookies: Record<string, string> = {}
): Response {
  // Copy all existing headers from the request
  const headers = new Headers()
  c.req.raw.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      headers.set(key, value)
    }
  })

  // Set the redirect location
  headers.set('Location', redirectUrl)

  // Create array for all cookies
  const allCookies: string[] = []

  // Add the error cookie
  allCookies.push(
    `${COOKIES.MESSAGE_FOUND}=${encodeURIComponent(message)}; Path=/; HttpOnly; SameSite=Strict`
  )

  // Add any additional cookies
  Object.entries(additionalCookies).forEach(([name, value]) => {
    allCookies.push(
      `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict`
    )
  })

  // Set all cookies
  allCookies.forEach((cookie) => {
    headers.append('Set-Cookie', cookie)
  })

  return new Response(null, {
    status: 302,
    headers,
  })
}

/**
 * Helper function to redirect with an error cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param errorMessage - The error message to display
 * @param additionalCookies - Optional additional cookies to include
 * @returns Response object with redirect and cookie
 */
export function redirectWithError(
  c: Context,
  redirectUrl: string,
  errorMessage: string,
  additionalCookies: Record<string, string> = {}
): Response {
  // Copy all existing headers from the request
  const headers = new Headers()
  c.req.raw.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      headers.set(key, value)
    }
  })

  // Set the redirect location
  headers.set('Location', redirectUrl)

  // Create array for all cookies
  const allCookies: string[] = []

  // Add the error cookie
  allCookies.push(
    `${COOKIES.ERROR_FOUND}=${encodeURIComponent(errorMessage)}; Path=/; HttpOnly; SameSite=Strict`
  )

  // Add any additional cookies
  Object.entries(additionalCookies).forEach(([name, value]) => {
    allCookies.push(
      `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict`
    )
  })

  // Set all cookies
  allCookies.forEach((cookie) => {
    headers.append('Set-Cookie', cookie)
  })

  return new Response(null, {
    status: 302,
    headers,
  })
}
