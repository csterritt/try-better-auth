import { test } from '@playwright/test'

import { clickLink } from './support/finders'
import { verifyOn404Page, verifyOnStartupPage } from './support/page-verifiers'

test('a bad path redirects to a proper 404 page', async ({ page }) => {
  // Navigate to nonexistent page
  await page.goto('http://localhost:3000/this/path/does/not/exist')
  await verifyOn404Page(page)
})

test('return to home from 404 page works', async ({ page }) => {
  // Navigate to nonexistent page and return home
  await page.goto('http://localhost:3000/this/path/does/not/exist')
  await clickLink(page, 'root-link')
  await verifyOnStartupPage(page)
})
