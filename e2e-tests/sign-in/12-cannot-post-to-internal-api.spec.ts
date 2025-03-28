import { test, expect } from '@playwright/test'

test('cannot post directly to internal client API endpoint', async ({
  page,
}) => {
  // Attempt to POST directly to the internal client API endpoint used by the server
  const response = await page.request.post(
    'http://localhost:3000/api/auth/email-otp/send-verification-otp',
    {
      data: {
        email: 'fred@fredfred.fred',
        type: 'sign-in',
      },
      failOnStatusCode: false, // Prevent Playwright from throwing on non-2xx status
    }
  )

  // Verify that the request is blocked (e.g., returns 404 Not Found or 403 Forbidden)
  expect(response.status()).toBe(404)
})
