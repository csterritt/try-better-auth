import { test, expect } from '@playwright/test'

import { verifyOnSignInPage } from '../support/page-verifiers'
import { verifyAlert } from '../support/finders'

test('cannot visit protected page when signed out', async ({ page }) => {
  // Try to directly access the protected page
  await page.goto('http://localhost:3000/protected')

  // Verify we're redirected to the sign-in page
  await verifyOnSignInPage(page)

  // Verify the error message is displayed
  await verifyAlert(page, 'You must be signed in to visit that page')
})
