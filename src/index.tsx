import { Hono, Context } from 'hono'
import { showRoutes } from 'hono/dev'
import { logger } from 'hono/logger'

import { renderer } from './renderer'
import { auth } from './auth'
import { authMiddleware } from './middleware'
import { authRoutes } from './auth-routes'

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

showRoutes(app)

export default app
