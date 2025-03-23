import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnAwaitCodePage,
} from '../support/page-verifiers'
import { startSignIn, cancelSignIn, submitEmail } from '../support/auth-helpers'

test('canceling code submission returns to startup page', async ({ page }) => {
  // Start sign in and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await verifyOnAwaitCodePage(page)

  // Cancel sign in and verify return to startup
  await cancelSignIn(page)
  await verifyOnStartupPage(page)
})
