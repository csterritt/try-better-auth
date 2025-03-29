import { Context, Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import fs from 'fs'

import { Env } from '../cf-env'
import { auth } from './auth'
import {
  COOKIES,
  IS_PRODUCTION,
  PATHS,
  REDIRECTS,
  VALIDATION,
} from '../constants'
import { redirectWithError, redirectWithMessage } from '../support/redirects'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | undefined | File
}

const authRoutes = new Hono<{ Bindings: Env }>()

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

// Handle all Better Auth API routes
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

/**
 * Start OTP verification process
 * Receives email in the request body and redirects to the await-code page
 */
authRoutes.post(PATHS.AUTH.SERVER.START_OTP, async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = (formData.email as string | undefined) || ''

    // Store email in cookie for later use
    setCookie(c, COOKIES.EMAIL_ENTERED, email, {
      path: '/',
    })

    if (!email || typeof email !== 'string') {
      return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Email is required', {
        [COOKIES.EMAIL_ENTERED]: email,
      })
    }

    // Validate email format
    if (!VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
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
        Authorization: `Bearer ${c.env.CLIENT_PERMISSION}`,
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
      return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Failed to send OTP')
    }

    // Redirect to the await-code page
    return c.redirect(
      `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
      302
    )
  } catch (error) {
    console.error('Start OTP error:', error)
    return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Failed to start OTP process')
  }
})

/**
 * Finish OTP verification process
 * Receives email and OTP in the request body and redirects to the home page
 */
authRoutes.post(PATHS.AUTH.SERVER.FINISH_OTP, async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    let email = formData.email as string | undefined
    let otp = formData.otp as string | undefined

    if (!email) {
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email || '')}`,
        'Email is required',
        { [COOKIES.EMAIL_ENTERED]: email?.toString() || '' }
      )
    }

    // Validate email format
    email = email.trim()
    if (!VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
        'Please enter a valid email address',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    if (!otp || otp.trim().length !== 6) {
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        "You must supply the code sent to your email address. Check your spam filter, and after a few minutes, if it hasn't arrived, click the 'Resend' button below to try again.",
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    // In development mode, read OTP from file
    otp = otp.trim()
    if (!IS_PRODUCTION && otp === '123456') {
      try {
        const fileOtp = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
        console.log(
          'Using OTP from file:',
          fileOtp,
          'instead of user-provided OTP:',
          otp
        )
        otp = fileOtp
      } catch (fileError) {
        console.error('Error reading OTP from file:', fileError)
        // Continue with user-provided OTP if file read fails
      }
    }

    // Create a request to the Better Auth API with JSON body
    const url = new URL(PATHS.AUTH.CLIENT.SIGN_IN, c.req.url)

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
        Authorization: `Bearer ${c.env.CLIENT_PERMISSION}`,
      },
      body: JSON.stringify({
        email,
        otp,
      }),
    })

    // Call the Better Auth handler directly
    const response = await auth.handler(req)

    if (response.status !== 200) {
      const responseJson = (await response.json()) as any
      if (
        responseJson.code === 'OTP_EXPIRED' ||
        (!IS_PRODUCTION && otp === '111111')
      ) {
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'OTP has expired, please sign in again',
          { [COOKIES.EMAIL_ENTERED]: email }
        )
      } else {
        return redirectWithError(
          c,
          `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
          'Invalid OTP or verification failed',
          { [COOKIES.EMAIL_ENTERED]: email }
        )
      }
    }

    // Copy all headers from the Better Auth response to our response
    const responseHeaderEntries: [string, string][] = []
    response.headers.forEach((value, key) => {
      responseHeaderEntries.push([key, value])
    })

    // Redirect to protected page with the same headers
    const resp = new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(responseHeaderEntries),
        Location: REDIRECTS.AFTER_AUTH,
      },
    })

    // Clear the email cookie
    resp.headers.append(
      'Set-Cookie',
      `${COOKIES.EMAIL_ENTERED}=; Path=/; Max-Age=0`
    )

    // Set the message cookie
    resp.headers.append(
      'Set-Cookie',
      `${COOKIES.MESSAGE_FOUND}="Sign in successful!"; Path=/`
    )

    return resp
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
      return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Failed to verify OTP')
    }
  }
})

/**
 * Resend OTP code
 * Similar to START_OTP but redirects back to AWAIT_CODE page with message
 */
authRoutes.post(PATHS.AUTH.SERVER.RESEND_CODE, async (c: Context) => {
  try {
    const formData: FormDataType = await c.req.parseBody()
    const email = formData.email as string

    console.log(`RESEND_CODE invoked for email: ${email}`)

    // Validate email format
    if (!email || !VALIDATION.EMAIL_REGEX.test(email) || email.length > 254) {
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
        'Please enter a valid email address',
        { [COOKIES.EMAIL_ENTERED]: email || '' }
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
        Authorization: `Bearer ${c.env.CLIENT_PERMISSION}`,
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
      console.error('Error resending OTP:', responseText)
      return redirectWithError(
        c,
        `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
        'Failed to resend verification code',
        { [COOKIES.EMAIL_ENTERED]: email }
      )
    }

    // Redirect back to await-code page with success message
    return redirectWithMessage(
      c,
      `${PATHS.AUTH.SERVER.AWAIT_CODE}?email=${encodeURIComponent(email)}`,
      'Code sent! Please check your email (including spam folder).',
      { [COOKIES.EMAIL_ENTERED]: email }
    )
  } catch (error) {
    console.error('Error resending OTP:', error)
    return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Failed to resend code')
  }
})

/**
 * Cancel OTP verification process
 * Clears the email cookie and redirects to the home page
 */
authRoutes.get(PATHS.AUTH.SERVER.CANCEL_OTP, (c: Context) => {
  // Clear the email cookie
  deleteCookie(c, COOKIES.EMAIL_ENTERED)

  // Redirect to home
  return c.redirect(PATHS.HOME, 302)
})

/**
 * Sign out endpoint
 * Clears the session cookie and redirects to the home page
 */
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

    // Redirect to home page with a message
    return redirectWithMessage(c, PATHS.HOME, 'Sign out successful')
  } catch (error) {
    console.error('Sign out error:', error)
    return redirectWithError(c, PATHS.HOME, 'Failed to sign out')
  }
})

/**
 * Sign-in page
 * Renders a form for the user to enter their email to start OTP process
 */
authRoutes.get(PATHS.AUTH.SERVER.SIGN_IN, (c: Context) => {
  // Get the email from cookie if it exists
  const emailFromCookie = getCookie(c, COOKIES.EMAIL_ENTERED) || ''

  // Check for message cookie
  const message = getCookie(c, COOKIES.MESSAGE_FOUND)
  if (message) {
    deleteCookie(c, COOKIES.MESSAGE_FOUND, { path: '/' })
  }

  // Check for error cookie
  const errorMessage = getCookie(c, COOKIES.ERROR_FOUND)
  if (errorMessage) {
    deleteCookie(c, COOKIES.ERROR_FOUND, { path: '/' })
  }

  return c.render(
    <div data-testid='sign-in-page-banner'>
      <h3>Sign in with OTP</h3>
      
      {message && (
        <div style={{ color: 'green', marginBottom: '15px' }} role='alert'>
          {message}
        </div>
      )}
      
      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '15px' }} role='alert'>
          {errorMessage}
        </div>
      )}
      
      <form
        action={PATHS.AUTH.SERVER.START_OTP}
        method='post'
        data-testid='sign-in-form'
      >
        <input
          type='email'
          id='email'
          name='email'
          placeholder='Email'
          required
          title='Please enter a valid email address'
          value={emailFromCookie}
          data-testid='email-input'
        />
        <button type='submit' data-testid='submit'>
          Send OTP
        </button>
      </form>
      
      <p>
        <a href={PATHS.HOME} data-testid='back-to-home-link'>
          Back to Home
        </a>
      </p>
    </div>
  )
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

  // Check for message cookie using Hono's getCookie
  const message = getCookie(c, COOKIES.MESSAGE_FOUND)

  // Clear the message cookie if it exists using Hono's deleteCookie
  if (message) {
    deleteCookie(c, COOKIES.MESSAGE_FOUND, { path: '/' })
  }

  // Get error message from cookie if it exists
  const errorMessage = getCookie(c, COOKIES.ERROR_FOUND)
  if (errorMessage) {
    deleteCookie(c, COOKIES.ERROR_FOUND)
  }

  // If no email is provided, redirect to home with error
  if (!email) {
    return redirectWithError(c, PATHS.AUTH.SERVER.SIGN_IN, 'Email is required')
  }

  return c.render(
    <div data-testid='await-code-page-banner'>
      <h2>Enter Verification Code</h2>
      <p data-testid='please-enter-code-message'>
        Please enter the code sent to {email}
      </p>
      {message && (
        <div style={{ color: 'green', marginBottom: '15px' }} role='alert'>
          {message}
        </div>
      )}

      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '15px' }} role='alert'>
          {errorMessage}
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
        <button type='submit' data-testid='submit'>
          Verify
        </button>
      </form>
      <p>
        {/* Resend Code Button */}
        <form action={PATHS.AUTH.SERVER.RESEND_CODE} method='post'>
          <input type='hidden' name='email' value={email} />
          <button type='submit' data-testid='resend-code-button'>
            Resend Code
          </button>
        </form>
      </p>
      <p>
        <a
          href={PATHS.AUTH.SERVER.CANCEL_OTP}
          data-testid='cancel-sign-in-link'
        >
          Cancel
        </a>
      </p>
    </div>
  )
})

export { authRoutes }
