import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnAwaitCodePage,
} from '../support/page-verifiers'
import { startSignIn, submitEmail, cancelSignIn } from '../support/auth-helpers'

test('submitting a known email succeeds', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await verifyOnAwaitCodePage(page)

  // Cancel to reset internal state
  await cancelSignIn(page)
})
