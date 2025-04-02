import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import { setTimeout } from 'timers/promises'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  resendCodeAndVerify,
  submitBadCode,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink } from '../support/finders'

test('clicking resend code button with proper wait allows user to resend code', async ({
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

  // Wait for two seconds to get past OTP wait time
  await setTimeout(2000)

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

test('clicking resend code button immediately shows wait time error', async ({
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

  // Click resend button immediately (without waiting)
  await clickLink(page, 'resend-code-button')

  // Verify error message about waiting
  const alertElement = page.getByRole('alert')
  await expect(alertElement).toBeVisible()
  
  // Get the alert text and verify it contains the wait message
  const alertText = await alertElement.textContent()
  expect(alertText).toContain('Please wait another')
  expect(alertText).toContain('seconds before asking for another code')
  
  // Verify the alert contains a number (the remaining seconds)
  const secondsMatch = alertText?.match(/another (\d+) seconds/)
  expect(secondsMatch).not.toBeNull()
  expect(parseInt(secondsMatch?.[1] || '0')).toBeGreaterThan(0)

  // Wait for the required time
  await setTimeout(2000)

  // Now we should be able to resend
  await resendCodeAndVerify(page)

  // Read the second OTP code from the file
  const secondCode = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
  console.log('Second code:', secondCode)

  // Try the second code - should succeed
  await submitValidCode(page, secondCode)

  // Sign out and verify we're back on the home page
  await clickLink(page, 'visit-home-link')
  await signOutAndVerify(page)
})

test('resending code twice with wait in between, then immediately trying a third time shows error', async ({
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

  // Wait for the required time before first resend
  await setTimeout(2000)

  // First resend - should work
  await resendCodeAndVerify(page)

  // Read the second OTP code from the file
  const secondCode = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
  console.log('Second code:', secondCode)

  // Wait for the required time before second resend
  await setTimeout(2000)

  // Second resend - should work
  await resendCodeAndVerify(page)

  // Read the third OTP code from the file
  const thirdCode = fs.readFileSync('/tmp/otp.txt', 'utf8').trim()
  console.log('Third code:', thirdCode)

  // Try to resend immediately after second resend - should show error
  await clickLink(page, 'resend-code-button')

  // Verify error message about waiting
  const alertElement = page.getByRole('alert')
  await expect(alertElement).toBeVisible()
  
  // Get the alert text and verify it contains the wait message
  const alertText = await alertElement.textContent()
  expect(alertText).toContain('Please wait another')
  expect(alertText).toContain('seconds before asking for another code')
  
  // Verify the alert contains a number (the remaining seconds)
  const secondsMatch = alertText?.match(/another (\d+) seconds/)
  expect(secondsMatch).not.toBeNull()
  expect(parseInt(secondsMatch?.[1] || '0')).toBeGreaterThan(0)

  // Try the third code - should succeed
  await submitValidCode(page, thirdCode)

  // Sign out and verify we're back on the home page
  await clickLink(page, 'visit-home-link')
  await signOutAndVerify(page)
})
