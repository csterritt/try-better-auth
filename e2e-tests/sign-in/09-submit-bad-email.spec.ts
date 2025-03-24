import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitInvalidEmail,
  cancelSignIn,
} from '../support/auth-helpers'

test('submitting an invalid email shows error', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit invalid email and verify error
  await submitInvalidEmail(page, 'xx@yy')
})
