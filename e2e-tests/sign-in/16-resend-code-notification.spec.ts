import { test as baseTest, expect, Page } from '@playwright/test'
import * as fs from 'fs'
import { setTimeout } from 'timers/promises'
import * as path from 'path'

import { verifyOnStartupPage } from '../support/page-verifiers'
import {
  startSignIn,
  submitEmail,
  resendCodeAndVerify,
  submitBadCode,
  submitValidCode,
  signOutAndVerify,
} from '../support/auth-helpers'
import { clickLink, verifyAlert } from '../support/finders'

// Fixed OTP file path used by the backend
const OTP_FILE_PATH = '/tmp/otp.txt'

// Create a test fixture with isolated test context
type TestFixture = {
  page: Page
  testId: string
  testEmail: string
}

// Extend the base test with our custom fixture
const test = baseTest.extend<TestFixture>({
  testId: async ({}, use, testInfo) => {
    // Generate a unique test ID for isolation
    const uniqueId = `${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    await use(uniqueId)
  },
  testEmail: async ({ testId }, use) => {
    // Create a unique email for each test run
    await use(`fredfred+${testId}@team439980.testinator.com`)
  },
})

// Helper function to read OTP code with retries and clear the file after reading
async function readOtpCode(maxRetries = 10, retryDelay = 200): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (fs.existsSync(OTP_FILE_PATH)) {
        const code = fs.readFileSync(OTP_FILE_PATH, 'utf8').trim()
        if (code.length > 0) {
          console.log(`Read OTP code: ${code}`)

          // Clear the file after reading to avoid conflicts with other tests
          fs.writeFileSync(OTP_FILE_PATH, '')

          return code
        }
      }
    } catch (e) {
      console.log(
        `Error reading OTP file (attempt ${attempt + 1}/${maxRetries}):`,
        e
      )
    }
    await setTimeout(retryDelay)
  }
  throw new Error(
    `Failed to read OTP code from ${OTP_FILE_PATH} after ${maxRetries} attempts`
  )
}

// Try to resend code and check if it was successful
async function tryResendCode(page: Page): Promise<boolean> {
  // Click the resend button
  await clickLink(page, 'resend-code-button')

  // Check for alert message
  const alertElement = page.getByRole('alert')
  await expect(alertElement).toBeVisible({ timeout: 5000 })

  // Get alert text to determine if resend was successful or showed wait time error
  const alertText = (await alertElement.textContent()) || ''

  if (alertText.includes('Code sent!')) {
    console.log('✅ Successfully resent code')
    return true
  } else if (alertText.includes('Please wait another')) {
    console.log('❌ Resend failed: Need to wait')
    return false
  } else {
    console.log('⚠️ Unexpected alert message:', alertText)
    return false
  }
}

// Wait for enough time to pass so resend becomes available
async function waitForResendAvailable(
  page: Page,
  maxWaitTime = 10000
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitTime) {
    // Try to resend
    const success = await tryResendCode(page)
    if (success) {
      return // Resend succeeded
    }

    // Wait a bit before trying again
    await setTimeout(1000)
  }

  throw new Error('Timed out waiting for resend to become available')
}

// Use describe.serial to run these tests in sequence since they share the OTP file
test.describe.serial('Resend code notification tests', () => {
  test('clicking resend code button with proper wait allows user to resend code', async ({
    page,
    testEmail,
  }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Submit unique email to get to the await code page
    await submitEmail(page, testEmail)

    // Read the first OTP code using our retry mechanism
    const firstCode = await readOtpCode()
    console.log('First code:', firstCode)

    // Wait approximately 3 seconds to ensure resend becomes available
    await setTimeout(3000)

    // Try to resend code and verify it succeeds
    const resendSucceeded = await tryResendCode(page)
    expect(resendSucceeded).toBe(true)

    // Read the second OTP code with retries
    const secondCode = await readOtpCode()
    console.log('Second code:', secondCode)

    // Verify we got a different code
    expect(secondCode).not.toBe(firstCode)

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
    testEmail,
  }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Submit unique email to get to the await code page
    await submitEmail(page, testEmail)

    // Read the first OTP code with retries
    const firstCode = await readOtpCode()
    console.log('First code:', firstCode)

    // Click resend button immediately (without waiting)
    const immediateResendSucceeded = await tryResendCode(page)

    // Should fail immediately
    expect(immediateResendSucceeded).toBe(false)

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

    // Wait for resend to become available
    await waitForResendAvailable(page)

    // Read the second OTP code with retries
    const secondCode = await readOtpCode()
    console.log('Second code:', secondCode)

    // Try the second code - should succeed
    await submitValidCode(page, secondCode)

    // Sign out and verify we're back on the home page
    await clickLink(page, 'visit-home-link')
    await signOutAndVerify(page)
  })

  test('resending code twice with wait in between and then immediately trying a third time shows error', async ({
    page,
    testEmail,
  }) => {
    // Navigate to startup page and verify
    await page.goto('http://localhost:3000/')
    await verifyOnStartupPage(page)
    await startSignIn(page)

    // Submit unique email to get to the await code page
    await submitEmail(page, testEmail)

    // Read the first OTP code with retries
    const firstCode = await readOtpCode()
    console.log('First code:', firstCode)

    // Wait for resend to become available and resend first time
    await waitForResendAvailable(page)

    // Read the second OTP code with retries
    const secondCode = await readOtpCode()
    console.log('Second code:', secondCode)
    expect(secondCode).not.toBe(firstCode)

    // Wait for resend to become available and resend second time
    await waitForResendAvailable(page)

    // Read the third OTP code with retries
    const thirdCode = await readOtpCode()
    console.log('Third code:', thirdCode)
    expect(thirdCode).not.toBe(secondCode)

    // Try to resend immediately after second resend - should show error
    const immediateResendSucceeded = await tryResendCode(page)
    expect(immediateResendSucceeded).toBe(false)

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
})
