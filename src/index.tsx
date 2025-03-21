import { Hono, Context } from 'hono'
import { showRoutes } from 'hono/dev'
import { logger } from 'hono/logger'

import { renderer } from './renderer'
import { auth } from './auth'
import { authMiddleware } from './middleware'

// Define a session type to match what Better Auth will provide
interface User {
  id: string
  email: string
}

interface Session {
  user: User | null
}

declare module 'hono' {
  interface ContextVariableMap {
    session: Session | null
  }
}

// Define environment bindings for Cloudflare Workers
interface Env {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

// Apply the logger middleware
app.use('*', logger())

// Apply the renderer middleware
app.use(renderer)

// Apply the authentication middleware to all routes
app.use('*', authMiddleware)

// Handle all Better Auth API routes
// Using the correct app.on() method according to Better Auth docs
app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
  try {
    // Call the auth handler with the raw request
    return auth.handler(c.req.raw)
  } catch (error) {
    console.error('Auth handler error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

/**
 * Props for the authenticated view component
 */
interface AuthenticatedViewProps {
  session: Session | null
}

/**
 * Renders the authenticated user view
 * @param props Component props containing the session
 * @returns JSX element for the authenticated view
 */
const AuthenticatedView = ({ session }: AuthenticatedViewProps) => {
  const userEmail = session?.user?.email || 'User'

  return (
    <div>
      <p>Welcome, {userEmail}!</p>
      <p>You are logged in.</p>
      <form action='/api/serv-auth/sign-out' method='post'>
        <button type='submit'>Sign Out</button>
      </form>
      <a href='/protected'>Go to protected page</a>
    </div>
  )
}

/**
 * Renders the login form for unauthenticated users
 * @returns JSX element for the login form
 */
const LoginForm = () => {
  return (
    <div>
      <h4>Login with OTP</h4>
      <form action='/api/serv-auth/start-otp' method='post'>
        <input
          type='email'
          id='email'
          name='email'
          placeholder='Email'
          required
        />
        <button type='submit'>Send OTP</button>
      </form>
    </div>
  )
}

/**
 * Protected content view for authenticated users
 * @param props Component props containing the session
 * @returns JSX element for the protected content
 */
const ProtectedContent = ({ session }: AuthenticatedViewProps) => {
  return (
    <div>
      <p>Welcome to the protected page, {session?.user?.email || 'User'}!</p>
      <p>
        <a href='/'>Back to Home</a>
      </p>
    </div>
  )
}

/**
 * Unauthorized content view for unauthenticated users
 * @returns JSX element for the unauthorized content
 */
const UnauthorizedContent = () => {
  return (
    <div>
      <p>You need to be logged in to view this page.</p>
      <p>
        <a href='/'>Back to Home</a>
      </p>
    </div>
  )
}

// Home route - accessible to everyone
app.get('/', (c: Context) => {
  const session = c.get('session')
  const isLoggedIn = !!session?.user

  return c.render(
    <div>
      <h1>Authentication Example with Better Auth Email OTP</h1>
      {isLoggedIn ? <AuthenticatedView session={session} /> : <LoginForm />}
    </div>
  )
})

// Protected route - only accessible to authenticated users
app.get('/protected', (c: Context) => {
  const session = c.get('session')
  return c.render(
    <div>
      <h3>Protected Page</h3>
      {session?.user ? (
        <ProtectedContent session={session} />
      ) : (
        <UnauthorizedContent />
      )}
    </div>
  )
})

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 */
app.post('/api/serv-auth/start-otp', async (c) => {
  try {
    const { email } = await c.req.parseBody()

    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400)
    }

    // Store email in session or send OTP via Better Auth
    // Create a request to the Better Auth API with JSON body
    const url = new URL('/api/auth/email-otp/send-verification-otp', c.req.url)

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
      return c.json({ error: 'Failed to send OTP' }, 500)
    }

    // Redirect to the await-code page
    return c.redirect(
      '/api/serv-auth/await-code?email=' + encodeURIComponent(email),
      302
    )
  } catch (error) {
    console.error('Start OTP error:', error)
    return c.json({ error: 'Failed to start OTP process' }, 500)
  }
})

/**
 * Finish OTP verification process
 * Receives email and OTP in the request body and redirects to the home page
 */
app.post('/api/serv-auth/finish-otp', async (c) => {
  try {
    const { email, otp } = await c.req.parseBody()

    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400)
    }

    if (!otp || typeof otp !== 'string') {
      return c.json({ error: 'OTP is required' }, 400)
    }

    // Create a request to the Better Auth API with JSON body
    const url = new URL('/api/auth/sign-in/email-otp', c.req.url)

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
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    })

    // Call the Better Auth handler directly
    const response = await auth.handler(req)

    // Check if the request was successful
    if (response.status !== 200) {
      const responseText = await response.text()
      console.error('Error response:', responseText)
      return c.json({ error: 'Invalid OTP or verification failed' }, 400)
    }

    // Copy all headers from the Better Auth response to our response
    const responseHeaderEntries: [string, string][] = []
    response.headers.forEach((value, key) => {
      responseHeaderEntries.push([key, value])
    })

    // Redirect to protected page with the same headers
    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(responseHeaderEntries),
        Location: '/protected',
      },
    })
  } catch (error) {
    console.error('Finish OTP error:', error)
    return c.json({ error: 'Failed to verify OTP' }, 500)
  }
})

/**
 * Sign out the user
 */
app.post('/api/serv-auth/sign-out', async (c) => {
  try {
    // Create a request to the Better Auth API
    const url = new URL('/api/auth/sign-out', c.req.url)

    // Convert headers to an object
    const headerEntries: [string, string][] = []
    c.req.raw.headers.forEach((value, key) => {
      headerEntries.push([key, value])
    })

    const req = new Request(url.toString(), {
      method: 'POST',
      headers: Object.fromEntries(headerEntries),
    })

    // Call the Better Auth handler directly
    const response = await auth.handler(req)

    // Check if the request was successful
    if (response.status !== 200) {
      const responseText = await response.text()
      console.error('Error response:', responseText)
      return c.json({ error: 'Failed to sign out' }, 500)
    }

    // Copy all headers from the Better Auth response to our response
    const responseHeaderEntries: [string, string][] = []
    response.headers.forEach((value, key) => {
      responseHeaderEntries.push([key, value])
    })

    // Redirect to home page with the same headers
    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(responseHeaderEntries),
        Location: '/',
      },
    })
  } catch (error) {
    console.error('Sign out error:', error)
    return c.json({ error: 'Failed to sign out' }, 500)
  }
})

/**
 * Await code page
 * Displays a form to enter the OTP code
 */
app.get('/api/serv-auth/await-code', (c) => {
  const email = c.req.query('email') || ''

  return c.render(
    <div>
      <h2>Enter Verification Code</h2>
      <p>We've sent a verification code to {email}.</p>
      <form action='/api/serv-auth/finish-otp' method='post'>
        <input type='hidden' name='email' value={email} />
        <div>
          <label htmlFor='otp'>Verification Code:</label>
          <input
            type='text'
            id='otp'
            name='otp'
            placeholder='Enter code'
            required
          />
        </div>
        <button type='submit'>Verify</button>
      </form>
      <p>
        <a href='/'>Cancel</a>
      </p>
    </div>
  )
})

showRoutes(app)

export default app
