import { test } from '@playwright/test'
import * as fs from 'fs'

import {
  verifyOnStartupPage,
  verifyOnAwaitCodePage,
} from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  resendCodeAndVerify,
  submitBadCode,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink } from '../support/finders'

test('clicking resend code button allows user to resend code', async ({
  page,
}) => {
  // Navigate to startup page and verify
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
  await startSignIn(page)

  // Submit known email to get to the await code page
  const testEmail = 'fredfred@team439980.testinator.com'
  await submitEmail(page, testEmail)

  // Read the first OTP code from the file
  const firstCode = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
  console.log('First code:', firstCode)

  // Click resend button and verify notification
  await resendCodeAndVerify(page)

  // Read the second OTP code from the file
  const secondCode = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
  console.log('Second code:', secondCode)

  // Try the first code - should fail
  await submitBadCode(page, firstCode)

  // Try the second code - should succeed
  await submitValidCode(page, secondCode)

  // Sign out and verify we're back on the home page
  await clickLink(page, 'visit-home-link')
  await signOutAndVerify(page)
})
