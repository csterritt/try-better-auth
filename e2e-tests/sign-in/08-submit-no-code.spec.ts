import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnAwaitCodePage,
} from '../support/page-verifiers'
import {
  cancelSignIn,
  startSignIn,
  submitEmail,
  submitInvalidCode,
} from '../support/auth-helpers'

test('submitting no code fails', async ({ page }) => {
  // Start sign in and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')
  await verifyOnAwaitCodePage(page)

  // Submit empty code and verify failure
  await submitInvalidCode(page)
  await verifyOnAwaitCodePage(page)

  // Cancel to reset internal state
  await cancelSignIn(page)
})
