import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink } from '../support/finders'

test('submitting a valid email and code succeeds', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')

  // Submit valid code and verify successful sign-in
  await submitValidCode(page, '123456')

  // Sign out to clean up the authenticated session
  await clickLink(page, 'visit-home-link')
  await signOutAndVerify(page)
})
