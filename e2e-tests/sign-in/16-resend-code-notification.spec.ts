import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  resendCodeAndVerify,
  cancelSignIn,
} from '../support/auth-helpers'

test('clicking resend code button shows notification message', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email to get to the await code page
  await submitEmail(page, 'fredfred@team439980.testinator.com')

  // Click resend button and verify notification
  await resendCodeAndVerify(page)

  // Cancel to reset internal state
  await cancelSignIn(page)
})
