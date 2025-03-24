import { Hono, Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

import { auth } from './auth'
import { PATHS, COOKIES, REDIRECTS, VALIDATION } from '../constants'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | undefined | File
}

// Create a new Hono app instance for auth routes
const authRoutes = new Hono()

/**
 * Helper function to redirect with an error cookie
 * @param c - Hono context
 * @param redirectUrl - URL to redirect to
 * @param errorMessage - The error message to display
 * @param additionalCookies - Optional additional cookies to include
 * @returns Response object with redirect and cookie
 */
function redirectWithError(
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

// Handle all Better Auth API routes
// Using the correct app.on() method according to Better Auth docs
authRoutes.on(
  ['POST', 'GET'],
  `${PATHS.AUTH.API_BASE}/*`,
  async (c: Context) => {
    try {
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

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 */
authRoutes.post(PATHS.AUTH.SERVER.START_OTP, async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = formData.email ?? ''

    // Store email in cookie for later use
    setCookie(c, COOKIES.EMAIL_ENTERED, email.toString())

    if (!email || typeof email !== 'string') {
      return redirectWithError(c, PATHS.HOME, 'Email is required', {
        [COOKIES.EMAIL_ENTERED]: email.toString(),
      })
    }

    // Validate email format
    if (!VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
      return redirectWithError(
        c,
        PATHS.HOME,
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
      return redirectWithError(c, PATHS.HOME, 'Failed to send OTP')
    }

    // Redirect to the await-code page
    return c.redirect(
      `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
      302
    )
  } catch (error) {
    console.error('Start OTP error:', error)
    return redirectWithError(c, PATHS.HOME, 'Failed to start OTP process')
  }
})

/**
 * Finish OTP verification process
 * Receives email and OTP in the request body and redirects to the home page
 */
authRoutes.post(PATHS.AUTH.SERVER.FINISH_OTP, async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = formData.email as string | undefined
    const otp = formData.otp as string | undefined

    if (!email || typeof email !== 'string') {
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email || '')}`,
        'Email is required',
        { [COOKIES.EMAIL_ENTERED]: email?.toString() || '' }
      )
    }

    // Validate email format
    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      return redirectWithError(
        c,
        PATHS.HOME,
        'Please enter a valid email address',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    if (!otp || typeof otp !== 'string') {
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'OTP is required',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    // Create a request to the Better Auth API with JSON body
    const url = new URL(PATHS.AUTH.CLIENT.SIGN_IN, c.req.url)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    })

    if (response.status !== 200) {
      const responseText = await response.text()
      console.error('Error response:', responseText)
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'Invalid OTP or verification failed',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    // Copy all headers from the Better Auth response to our response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        c.header(key, value)
      }
    })

    // Clear the email cookie on successful login
    deleteCookie(c, COOKIES.EMAIL_ENTERED)

    // Redirect to protected page with the same headers
    return new Response(null, {
      status: 302,
      headers: {
        Location: REDIRECTS.AFTER_AUTH,
      },
    })
  } catch (error) {
    console.error('Finish OTP error:', error)
    try {
      const formData: FormDataType = await c.req.parseBody()
      const email = (formData.email as string | undefined) || ''
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'Failed to verify OTP',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    } catch {
      return redirectWithError(c, PATHS.HOME, 'Failed to verify OTP')
    }
  }
})

/**
 * Sign out endpoint
 * Clears the session cookie and redirects to the home page
 */
authRoutes.post(PATHS.AUTH.SERVER.SIGN_OUT, async (c: Context) => {
  try {
    // Create a request to the Better Auth API
    const url = new URL(PATHS.AUTH.CLIENT.SIGN_OUT, c.req.url)

    // Call the Better Auth API to sign out
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: c.req.header('cookie') || '',
      },
    })

    // Copy all headers from the Better Auth response to our response
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        c.header(key, value)
      }
    })

    // Clear our application cookies
    deleteCookie(c, COOKIES.ERROR_FOUND)
    deleteCookie(c, COOKIES.EMAIL_ENTERED)

    // Redirect to the home page
    return c.redirect(REDIRECTS.AFTER_SIGN_OUT)
  } catch (error) {
    console.error('Sign out error:', error)
    return redirectWithError(c, PATHS.HOME, 'Failed to sign out')
  }
})

/**
 * Await code page
 * Renders a form for the user to enter the OTP
 */
authRoutes.get(PATHS.AUTH.SERVER.AWAIT_CODE, (c: Context) => {
  // Get email from query parameter or cookie
  const queryEmail = c.req.query('email')
  const cookieEmail = getCookie(c, COOKIES.EMAIL_ENTERED)
  const email = queryEmail || cookieEmail || ''

  // Get error message from cookie if it exists
  const errorMessage = getCookie(c, COOKIES.ERROR_FOUND)
  if (errorMessage) {
    deleteCookie(c, COOKIES.ERROR_FOUND)
  }

  // If no email is provided, redirect to home with error
  if (!email) {
    return redirectWithError(c, PATHS.HOME, 'Email is required')
  }

  return c.render(
    <div data-testid='await-code-page-banner'>
      <h2>Enter Verification Code</h2>
      <p data-testid='please-enter-code-message'>
        Please enter the code sent to {email}
      </p>
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          Error: {errorMessage}
        </div>
      )}
      <form action={PATHS.AUTH.SERVER.FINISH_OTP} method='post'>
        <input type='hidden' name='email' value={email} />
        <input
          type='text'
          id='otp'
          name='otp'
          placeholder='Verification Code'
          required
          autoComplete='one-time-code'
        />
        <button type='submit'>Verify</button>
      </form>
      <p>
        <a href={PATHS.HOME} data-testid='cancel-sign-in-link'>
          Cancel
        </a>
      </p>
    </div>
  )
})

export { authRoutes }
