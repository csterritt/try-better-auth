import { test } from '@playwright/test'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  submitExpiredCode,
  cancelSignIn,
} from '../support/auth-helpers'

test('submitting an expired code shows token expired error', async ({
  page,
}) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email and verify success
  await submitEmail(page, 'fredfred@team439980.testinator.com')

  // Submit expired code and verify error
  await submitExpiredCode(page, '111111')
})
