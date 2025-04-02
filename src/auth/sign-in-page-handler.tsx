import { Context, Hono } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'

import { Env } from '../cf-env'
import { COOKIES, PATHS } from '../constants'

/**
 * Sign-in page
 * Renders a form for the user to enter their email to start OTP process
 * @param authRoutes - Hono instance for auth routes
 */
export const setupSignInPageHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
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
}
