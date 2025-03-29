import { Page, expect } from '@playwright/test'
import { clickLink, fillInput, getElementText, verifyAlert } from './finders'
import {
  verifyOnStartupPage,
  verifyOnSignInPage,
  verifyOnAwaitCodePage,
  verifyOnProtectedPage,
} from './page-verifiers'

export async function signOutAndVerify(page: Page) {
  await clickLink(page, 'sign-out-link')
  await verifyOnStartupPage(page)
}

export async function startSignIn(page: Page) {
  // Click the Sign In link on the home page
  await clickLink(page, 'sign-in-link')
  // Verify we're on the sign-in page
  await verifyOnSignInPage(page)
}

export async function submitCode(page: Page, code: string) {
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')
}

export async function submitEmail(page: Page, email: string) {
  await fillInput(page, 'email', email)
  await clickLink(page, 'submit')
  await verifyOnAwaitCodePage(page)

  // Verify instruction message
  const message = await getElementText(page, 'please-enter-code-message')
  expect(message).toBe(`Please enter the code sent to ${email}`)
}

export async function submitInvalidEmail(page: Page, email: string) {
  await fillInput(page, 'email', email)
  await clickLink(page, 'submit')
  await verifyOnSignInPage(page)
  await verifyAlert(page, `Please enter a valid email address`)

  // Verify email input still has value
  await expect(page.getByTestId('email-input')).toHaveValue(email)
}

export async function cancelSignIn(page: Page) {
  // Cancel sign-in and verify return to startup page (resets internal state)
  await clickLink(page, 'cancel-sign-in-link')
  await verifyOnStartupPage(page)
}

export async function submitInvalidCode(page: Page, code: string = ' ') {
  // Submit invalid code
  if (code) {
    await fillInput(page, 'code', code)
  }
  await clickLink(page, 'submit')

  // Verify error message for empty code
  await verifyAlert(
    page,
    `You must supply the code sent to your email address. Check your spam filter, and after a few minutes, if it hasn't arrived, click the 'Resend' button below to try again.`
  )

  // Re-verify we're still on the code entry page
  await verifyOnAwaitCodePage(page)
}

export async function submitValidCode(page: Page, code: string) {
  // Submit code and verify successful sign-in
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')
  await verifyAlert(page, 'Sign in successful!')

  // Verify we're on the protected page after successful sign-in
  await verifyOnProtectedPage(page)
}

export async function submitTimedOutCode(page: Page, code: string) {
  // Submit timed out code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify back on sign-in page with error
  await verifyOnSignInPage(page)
  await verifyAlert(page, 'That code has expired, please sign in again')
}

export async function submitBadCode(page: Page, code: string) {
  // Submit bad code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify we're back on await code page with error
  await verifyOnAwaitCodePage(page)
  await verifyAlert(page, 'Invalid OTP or verification failed')
}

export async function submitExpiredCode(page: Page, code: string) {
  // Submit expired code
  await fillInput(page, 'code', code)
  await clickLink(page, 'submit')

  // Verify we're back on home page with error
  await verifyOnSignInPage(page)
  await verifyAlert(page, 'OTP has expired, please sign in again')
}

export async function resendCodeAndVerify(page: Page) {
  // Click the resend button
  await clickLink(page, 'resend-code-button')

  // Verify we're still on the await code page
  await verifyOnAwaitCodePage(page)

  // Verify notification message
  await verifyAlert(
    page,
    'Code sent! Please check your email (including spam folder).'
  )
}

export async function searchPodcasts(page: Page, searchQuery: string) {
  // Fill the search input and submit the form
  await fillInput(page, 'Enter search term (min 4 characters)', searchQuery)
  await page.getByRole('button', { name: 'Search' }).click()
}

export async function verifySearchResultsCount(
  page: Page,
  expectedCount: number
) {
  // Get all search result cards
  const resultCards = page.locator('.card')
  await expect(resultCards).toHaveCount(expectedCount)
}
