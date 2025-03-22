import { Hono } from 'hono'
import { auth } from './auth'

// Define a session type to match what Better Auth will provide
interface User {
  id: string
  email: string
}

interface Session {
  user: User | null
}

// Create a new Hono app instance for auth routes
const authRoutes = new Hono()

// Handle all Better Auth API routes
// Using the correct app.on() method according to Better Auth docs
authRoutes.on(['POST', 'GET'], '/api/auth/*', async (c) => {
  try {
    // Call the auth handler with the raw request
    return auth.handler(c.req.raw)
  } catch (error) {
    console.error('Auth handler error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 */
authRoutes.post('/api/serv-auth/start-otp', async (c) => {
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
authRoutes.post('/api/serv-auth/finish-otp', async (c) => {
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
authRoutes.post('/api/serv-auth/sign-out', async (c) => {
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
authRoutes.get('/api/serv-auth/await-code', (c) => {
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

export { authRoutes }
