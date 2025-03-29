import { expect, test } from '@playwright/test'

import { elementExists } from './support/finders'
import { verifyOnStartupPage } from './support/page-verifiers'

test('initial startup page has proper banners', async ({ page }) => {
  // Navigate to startup page
  await page.goto('http://localhost:3000/')
  await verifyOnStartupPage(page)
})

test('initial startup page has a sign in link', async ({ page }) => {
  // Navigate to startup page
  await page.goto('http://localhost:3000/')
  expect(await elementExists(page, 'sign-in-link')).toBe(true)
})
