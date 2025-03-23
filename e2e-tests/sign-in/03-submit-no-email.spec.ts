import { test } from '@playwright/test'

import {
  verifyOnStartupPage,
  verifyOnSignInPage,
} from '../support/page-verifiers'
import { startSignIn, submitInvalidEmail } from '../support/auth-helpers'
import { clickLink, fillInput } from '../support/finders'

test('submitting no email fails', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit empty email and verify still on the sign in page
  await fillInput(page, 'email', '')
  await clickLink(page, 'submit')
  await verifyOnSignInPage(page)
})
