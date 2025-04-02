import { Context, Hono } from 'hono'
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
import { redirectWithError } from '../support/redirects'

// Define a type for form data from parseBody
type FormDataType = {
  [key: string]: string | undefined | File
}

/**
 * Finish OTP verification process
 * Receives email and OTP in the request body and redirects to the home page
 * @param authRoutes - Hono instance for auth routes
 */
export const setupFinishOtpHandler = (
  authRoutes: Hono<{ Bindings: Env }>
): void => {
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
        return redirectWithError(
          c,
          PATHS.AUTH.SERVER.SIGN_IN,
          'Failed to verify OTP'
        )
      }
    }
  })
}
