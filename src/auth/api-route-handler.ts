import { Context, Hono } from 'hono'

import { Env } from '../cf-env'
import { auth } from './auth'
import { PATHS } from '../constants'
import { redirectWithError } from '../support/redirects'

/**
 * Helper function to verify client permission token
 * @param c - Hono context
 * @returns boolean indicating if the token is valid
 */
function verifyClientPermission(c: Context): boolean {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  return token === c.env.CLIENT_PERMISSION
}

/**
 * Handle all Better Auth API routes
 * @param authRoutes - Hono instance for auth routes
 */
export const setupApiRouteHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
  // Using the correct app.on() method according to Better Auth docs
  authRoutes.on(
    ['POST', 'GET'],
    `${PATHS.AUTH.API_BASE}/*`,
    async (c: Context) => {
      try {
        // Verify the client permission
        if (!verifyClientPermission(c)) {
          // Otherwise return JSON error (fallback for API calls)
          return c.json({ error: 'Path not found' }, 404)
        }

        // Call the auth handler with the raw request
        return auth.handler(c.req.raw)
      } catch (error) {
        console.error('Auth handler error:', error)

        // If this is a POST request, try to redirect to home with error
        if (c.req.method === 'POST') {
          return redirectWithError(c, PATHS.HOME, 'Authentication failed')
        }

        // Otherwise return JSON error (fallback for API calls)
        return c.json({ error: 'Authentication failed' }, 500)
      }
    }
  )
}
