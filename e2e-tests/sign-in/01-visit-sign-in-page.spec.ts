import { test } from '@playwright/test'

import { verifyOnSignInPage } from '../support/page-verifiers'
import { startSignIn } from '../support/auth-helpers'

test('visiting sign in page shows sign in form', async ({ page }) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')

  // Start sign in and verify form shown
  await startSignIn(page)
  await verifyOnSignInPage(page)
})
