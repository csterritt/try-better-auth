import { test } from '@playwright/test'

import {
  verifyOnSignInPage,
  verifyOnStartupPage,
} from '../support/page-verifiers'
import {
  cancelSignIn,
  startSignIn,
  submitInvalidEmail,
} from '../support/auth-helpers'

test('submitting a too-short email fails', async ({ page }) => {
  // Start sign in and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit too short email and verify failure
  await submitInvalidEmail(page, 'a@b.c')
  await verifyOnSignInPage(page)
})

test('submitting a too-long email fails', async ({ page }) => {
  // Start sign in and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit too long email and verify failure
  const longEmail = 'a'.repeat(250) + '@example.com'
  await submitInvalidEmail(page, longEmail)
  await verifyOnSignInPage(page)
})
