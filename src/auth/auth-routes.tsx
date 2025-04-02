import { Hono } from 'hono'
import { Env } from '../cf-env'

// Import all the handler setup functions
import { setupApiRouteHandler } from './api-route-handler'
import { setupStartOtpHandler } from './start-otp-handler'
import { setupFinishOtpHandler } from './finish-otp-handler'
import { setupResendCodeHandler } from './resend-code-handler'
import { setupCancelOtpHandler } from './cancel-otp-handler'
import { setupSignOutHandler } from './sign-out-handler'
import { setupSignInPageHandler } from './sign-in-page-handler'
import { setupAwaitCodePageHandler } from './await-code-page-handler'

// Create the main auth routes instance
const authRoutes = new Hono<{ Bindings: Env }>()

// Set up all the route handlers
setupApiRouteHandler(authRoutes)
setupStartOtpHandler(authRoutes)
setupFinishOtpHandler(authRoutes)
setupResendCodeHandler(authRoutes)
setupCancelOtpHandler(authRoutes)
setupSignOutHandler(authRoutes)
setupSignInPageHandler(authRoutes)
setupAwaitCodePageHandler(authRoutes)

export { authRoutes }
