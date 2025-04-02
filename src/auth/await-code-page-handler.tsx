import { Context, Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { COOKIES, PATHS } from '../constants'
import { redirectWithError } from '../support/redirects'

/**
 * Await code page
 * Renders a form for the user to enter the OTP
 * @param authRoutes - Hono instance for auth routes
 */
export const setupAwaitCodePageHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
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
      return redirectWithError(
        c,
        PATHS.AUTH.SERVER.SIGN_IN,
        'Email is required'
      )
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
}
