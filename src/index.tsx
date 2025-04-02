import { Hono, Context } from 'hono'
import { Fragment } from 'hono/jsx'
import { getCookie, deleteCookie } from 'hono/cookie'
import { showRoutes } from 'hono/dev'
import { logger } from 'hono/logger'
import dotenv from 'dotenv'

import { Env } from './cf-env'
import { renderer } from './renderer'
import { authMiddleware } from './middleware'
import { authRoutes } from './auth/auth-routes'
import { PATHS, COOKIES } from './constants'

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

dotenv.config()
if (
  !process.env.CLIENT_PERMISSION ||
  process.env.CLIENT_PERMISSION.trim() === ''
) {
  console.error('[CLIENT_PERMISSION] environmental variable not found')
  process.exit(1)
}

const app = new Hono<{ Bindings: Env }>()

// Apply the logger middleware
app.use('*', logger())

// Apply the renderer middleware
app.use(renderer)

// Apply the authentication middleware to all routes
app.use('*', authMiddleware)

// Mount the auth routes
app.route('', authRoutes)

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
      <p>You are now signed in.</p>
      <p>
        <a href={PATHS.PROTECTED} data-testid='protected-link'>
          Go to Protected Page
        </a>
      </p>
      <form action={PATHS.AUTH.SERVER.SIGN_OUT} method='post'>
        <button type='submit' data-testid='sign-out-link'>
          Sign Out
        </button>
      </form>
    </div>
  )
}

/**
 * Renders the home page navigation for unauthenticated users
 * @returns JSX element for the navigation links
 */
const HomeNavigation = () => {
  return (
    <div>
      <p>Welcome to the Better Auth Example</p>
      <p>
        <a href={PATHS.AUTH.SERVER.SIGN_IN} data-testid='sign-in-link'>
          Sign In
        </a>
      </p>
      <p>
        <a href={PATHS.PROTECTED} data-testid='protected-link'>
          Go to Protected Page
        </a>
        <span> (requires authentication)</span>
      </p>
    </div>
  )
}

/**
 * Renders the login form for unauthenticated users
 * @returns JSX element for the login form
 */
const LoginForm = ({ c }: { c: Context }) => {
  // Get the email from cookie if it exists
  const emailFromCookie = getCookie(c, COOKIES.EMAIL_ENTERED) || ''

  return (
    <div>
      <h4>Sign in with OTP</h4>
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
    <div data-testid='protected-page-banner'>
      <p>Welcome to the protected page, {session?.user?.email || 'User'}!</p>
      <p>
        <a href={PATHS.HOME} data-testid='visit-home-link'>
          Back to Home
        </a>
      </p>
    </div>
  )
}

// Home route - accessible to everyone
app.get(PATHS.HOME, (c: Context) => {
  const session = c.get('session')
  const isLoggedIn = !!session?.user

  // Check for message cookie using Hono's getCookie
  const message = getCookie(c, COOKIES.MESSAGE_FOUND)

  // Clear the message cookie if it exists using Hono's deleteCookie
  if (message) {
    deleteCookie(c, COOKIES.MESSAGE_FOUND, { path: '/' })
  }

  // Check for error cookie using Hono's getCookie
  const errorMessage = getCookie(c, COOKIES.ERROR_FOUND)

  // Clear the error cookie if it exists using Hono's deleteCookie
  if (errorMessage) {
    deleteCookie(c, COOKIES.ERROR_FOUND, { path: '/' })
  }

  return c.render(
    <div data-testid='startup-page-banner'>
      <h3>Authentication Example with Better Auth Email OTP</h3>
      {message && (
        <div role='alert' style={{ color: 'green', marginBottom: '15px' }}>
          {message}
        </div>
      )}
      {errorMessage && (
        <div role='alert' style={{ color: 'red', marginBottom: '15px' }}>
          {errorMessage}
        </div>
      )}
      {isLoggedIn ? (
        <AuthenticatedView session={session} />
      ) : (
        <HomeNavigation />
      )}
    </div>
  )
})

// Protected route - only accessible to authenticated users
app.get(PATHS.PROTECTED, (c: Context) => {
  // Check for message cookie using Hono's getCookie
  const message = getCookie(c, COOKIES.MESSAGE_FOUND)

  // Clear the message cookie if it exists using Hono's deleteCookie
  if (message) {
    deleteCookie(c, COOKIES.MESSAGE_FOUND, { path: '/' })
  }

  // Check for error cookie using Hono's getCookie
  const errorMessage = getCookie(c, COOKIES.ERROR_FOUND)

  // Clear the error cookie if it exists using Hono's deleteCookie
  if (errorMessage) {
    deleteCookie(c, COOKIES.ERROR_FOUND, { path: '/' })
  }

  const session = c.get('session')
  return c.render(
    <div>
      <h3>Protected Page</h3>
      {message && (
        <div role='alert' style={{ color: 'green', marginBottom: '15px' }}>
          {message}
        </div>
      )}

      {errorMessage && (
        <div role='alert' style={{ color: 'red', marginBottom: '15px' }}>
          {errorMessage}
        </div>
      )}

      <ProtectedContent session={session} />
    </div>
  )
})

// MUST be the last path declared
app.all('/*', (c: Context) =>
  c.render(
    <Fragment>
      <div class='flex-grow mx-6' data-testid='404-page-banner'>
        <p class='text-2xl italic my-6' data-testid='404-message'>
          That page does not exist
        </p>

        <p>
          <a href={PATHS.HOME} class='btn btn-primary' data-testid='root-link'>
            Return home
          </a>
        </p>
      </div>
    </Fragment>
  )
)

showRoutes(app)

export default app
