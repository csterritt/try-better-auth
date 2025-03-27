import { test } from '@playwright/test'

import { verifyOnSignInPage } from '../support/page-verifiers'
import { verifyAlert } from '../support/finders'

test('direct navigation to await-code page redirects to sign-in page', async ({
  page,
}) => {
  // Try to navigate directly to the await-code page
  await page.goto('http://localhost:3000/api/serv-auth/await-code')

  // Verify redirect to sign-in page
  await verifyOnSignInPage(page)
  await verifyAlert(page, 'Email is required')
})
