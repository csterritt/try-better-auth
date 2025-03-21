import { Context, Next } from 'hono'
import { auth } from './auth'

// Define interface for session data
interface User {
  id: string
  email?: string
  name?: string
}

interface Session {
  user?: User
}

/**
 * Middleware to check authentication and add session data to the context
 */
export const authMiddleware = async (
  c: Context,
  next: Next
): Promise<Response | void> => {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    // Set the session in the context
    c.set('session', session || null)

    // Check if accessing a protected route without authentication
    const url = new URL(c.req.url)
    if (url.pathname === '/protected' && !session) {
      return c.redirect('/')
    }
  } catch (error) {
    // Log errors but continue - this prevents auth issues from breaking the app
    console.error('Auth middleware error:', error)
    c.set('session', null)
  }

  // Continue to the next middleware or route handler
  return next()
}
