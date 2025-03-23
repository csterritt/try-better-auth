import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitBadCode,
  cancelSignIn,
} from '../support/auth-helpers'

test('submitting an invalid code shows error', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')

  // Submit invalid code and verify error
  await submitBadCode(page, '999999')

  // Cancel to reset internal state
  await cancelSignIn(page)
})
