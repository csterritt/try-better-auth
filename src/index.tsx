import { Hono, Context } from 'hono'
import { showRoutes } from 'hono/dev'
import { logger } from 'hono/logger'

import { renderer } from './renderer'
import { auth } from './auth'
import { authMiddleware } from './middleware'

// Define a session type to match what Better Auth will provide
interface User {
  id: string
  email?: string
  name?: string
}

interface Session {
  user?: User
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

// Home route - accessible to everyone
app.get('/', (c: Context) => {
  const session = c.get('session')
  const isLoggedIn = !!session?.user

  return c.render(
    <div>
      <h1>Authentication Example with Better Auth Email OTP</h1>
      {isLoggedIn ? (
        <div>
          <p>Welcome, {session?.user?.email || 'User'}!</p>
          <p>You are logged in.</p>
          <button id='signOutBtn'>Sign Out</button>
          <a href='/protected'>Go to protected page</a>
        </div>
      ) : (
        <div>
          <h4>Login with OTP</h4>
          <form id='otpForm'>
            <input type='email' id='email' placeholder='Email' required />
            <button type='submit'>Send OTP</button>
          </form>
          <div id='otpVerify' style={{ display: 'none' }}>
            <form id='verifyForm'>
              <input type='text' id='otp' placeholder='Enter OTP' required />
              <button type='submit'>Verify & Login</button>
            </form>
          </div>
        </div>
      )}
      {/* Include the auth client bundle */}
      <script src='/auth-client-bundle.js'></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
        let userEmail = '';
        
        document.addEventListener('DOMContentLoaded', function() {
          const otpForm = document.getElementById('otpForm');
          const verifyForm = document.getElementById('verifyForm');
          const signOutBtn = document.getElementById('signOutBtn');
          
          if (otpForm) {
            otpForm.addEventListener('submit', async function(event) {
              event.preventDefault();
              const emailInput = document.getElementById('email');
              userEmail = emailInput.value;
              
              try {
                // Use the auth client to send OTP
                const success = await window.authClient.sendOTP(userEmail);
                
                if (success) {
                  document.getElementById('otpVerify').style.display = 'block';
                  document.getElementById('otpForm').style.display = 'none';
                } else {
                  alert('Failed to send OTP. Please try again.');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            });
          }
          
          if (verifyForm) {
            verifyForm.addEventListener('submit', async function(event) {
              event.preventDefault();
              const otpInput = document.getElementById('otp');
              const otp = otpInput.value;
              
              try {
                // Use the auth client to verify OTP
                console.log('Verifying OTP...');
                const success = await window.authClient.verifyOTP(userEmail, otp);
                console.log('OTP verification result:', success);
                
                if (success) {
                  window.location.reload();
                } else {
                  alert('Invalid OTP. Please try again.');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            });
          }
          
          if (signOutBtn) {
            signOutBtn.addEventListener('click', async function() {
              try {
                // Use the auth client to sign out
                const success = await window.authClient.signOut();
                
                if (success) {
                  window.location.reload();
                } else {
                  alert('Failed to sign out. Please try again.');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
              }
            });
          }
        });
      `,
        }}
      ></script>
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
        <div>
          <p>Welcome to the protected page, {session.user.email || 'User'}!</p>
          <p>
            <a href='/'>Back to Home</a>
          </p>
        </div>
      ) : (
        <div>
          <p>You need to be logged in to view this page.</p>
          <p>
            <a href='/'>Back to Home</a>
          </p>
        </div>
      )}
    </div>
  )
})

showRoutes(app)

export default app
