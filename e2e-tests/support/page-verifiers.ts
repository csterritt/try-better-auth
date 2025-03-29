import { Page, expect } from '@playwright/test'
import { elementExists, getElementText } from './finders'

export async function verifyOnStartupPage(page: Page) {
  expect(await elementExists(page, 'startup-page-banner')).toBe(true)
}

export async function verifyOnSignInPage(page: Page) {
  expect(await elementExists(page, 'sign-in-page-banner')).toBe(true)
}

export async function verifyOnAwaitCodePage(page: Page) {
  expect(await elementExists(page, 'await-code-page-banner')).toBe(true)
}

export async function verifyOnProtectedPage(page: Page) {
  expect(await elementExists(page, 'protected-page-banner')).toBe(true)
}

export async function verifyOn404Page(page: Page) {
  expect(await elementExists(page, '404-page-banner')).toBe(true)
  expect(await getElementText(page, '404-message')).toBe(
    'That page does not exist'
  )
}
