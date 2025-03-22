import { Hono, Context } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'
import { auth } from './auth'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | File
}

// Create a new Hono app instance for auth routes
const authRoutes = new Hono()

/**
 * Helper function to redirect to home with an error cookie
 * @param errorMessage - The error message to display
 * @returns Response object with redirect and cookie
 */
function redirectWithHomeError(errorMessage: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `ERROR_FOUND=${encodeURIComponent(errorMessage)}; Path=/; HttpOnly; SameSite=Strict`,
    },
  })
}

/**
 * Helper function to redirect to await-code with an error cookie
 * @param c - Hono context
 * @param email - User email
 * @param errorMessage - The error message to display
 * @returns Response object with redirect and cookie
 */
function redirectWithError(
  c: Context,
  email: string,
  errorMessage: string
): Response {
  const encodedEmail = encodeURIComponent(email || '')
  const redirectUrl = `/api/serv-auth/await-code?email=${encodedEmail}`

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      'Set-Cookie': `ERROR_FOUND=${encodeURIComponent(errorMessage)}; Path=/; HttpOnly; SameSite=Strict`,
    },
  })
}

// Handle all Better Auth API routes
// Using the correct app.on() method according to Better Auth docs
authRoutes.on(['POST', 'GET'], '/api/auth/*', async (c: Context) => {
  try {
    // Call the auth handler with the raw request
    return auth.handler(c.req.raw)
  } catch (error) {
    console.error('Auth handler error:', error)

    // If this is a POST request, try to redirect to home with error
    if (c.req.method === 'POST') {
      return redirectWithHomeError('Authentication failed')
    }

    // Otherwise return JSON error (fallback for API calls)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 */
authRoutes.post('/api/serv-auth/start-otp', async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = formData.email as string | undefined

    if (!email || typeof email !== 'string') {
      return redirectWithHomeError('Email is required')
    }

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
      return redirectWithHomeError('Failed to send OTP')
    }

    // Redirect to the await-code page
    return c.redirect(
      `/api/serv-auth/await-code?email=${encodeURIComponent(email)}`,
      302
    )
  } catch (error) {
    console.error('Start OTP error:', error)
    return redirectWithHomeError('Failed to start OTP process')
  }
})

/**
 * Finish OTP verification process
 * Receives email and OTP in the request body and redirects to the home page
 */
authRoutes.post('/api/serv-auth/finish-otp', async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = formData.email as string | undefined
    const otp = formData.otp as string | undefined

    if (!email || typeof email !== 'string') {
      return redirectWithError(c, email || '', 'Email is required')
    }

    if (!otp || typeof otp !== 'string') {
      return redirectWithError(c, email, 'OTP is required')
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
      return redirectWithError(c, email, 'Invalid OTP or verification failed')
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
    try {
      const formData: FormDataType = await c.req.parseBody()
      const email = (formData.email as string | undefined) || ''
      return redirectWithError(c, email, 'Failed to verify OTP')
    } catch {
      return redirectWithHomeError('Failed to verify OTP')
    }
  }
})

/**
 * Sign out the user
 */
authRoutes.post('/api/serv-auth/sign-out', async (c: Context) => {
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
      return redirectWithHomeError('Failed to sign out')
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
    return redirectWithHomeError('Failed to sign out')
  }
})

/**
 * Await code page
 * Displays a form to enter the OTP code
 */
authRoutes.get('/api/serv-auth/await-code', (c: Context) => {
  const email = c.req.query('email') || ''

  // Check for error cookie using Hono's getCookie
  const errorMessage = getCookie(c, 'ERROR_FOUND')

  // Clear the error cookie if it exists using Hono's deleteCookie
  if (errorMessage) {
    deleteCookie(c, 'ERROR_FOUND', { path: '/' })
  }

  return c.render(
    <div>
      <h2>Enter Verification Code</h2>
      <p>We've sent a verification code to {email}.</p>
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          Error: {errorMessage}
        </div>
      )}
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
