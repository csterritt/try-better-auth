import { expect, Page } from '@playwright/test' // UNREVIEWED

export const findItemByTestId = async (page: Page, testId: string) => {
  const item = page.getByTestId(testId)
  return expect(item).toBeVisible()
}

export const clickLink = async (page: Page, testId: string) => {
  return page.getByTestId(testId).first().click()
}

export const fillInput = async (
  page: Page,
  placeholder: string,
  value: string
) => {
  return page.getByPlaceholder(placeholder).fill(value)
}

export const verifyAlert = async (page: Page, expectedText: string) => {
  return await expect(page.getByRole('alert')).toHaveText(expectedText)
  // return page.getByTestId('alert-close').click()
}

export const verifyContentByTestId = async (
  page: Page,
  testId: string,
  expectedText: string
) => {
  return expect(page.getByTestId(testId)).toHaveText(expectedText)
}

export const elementExists = async (
  page: Page,
  testId: string
): Promise<boolean> => {
  try {
    const element = page.getByTestId(testId)
    await element.waitFor()
    return true
  } catch {
    return false
  }
}

export const getElementText = async (
  page: Page,
  testId: string
): Promise<string | null> => {
  try {
    const element = page.getByTestId(testId)
    await element.waitFor()
    return element.textContent()
  } catch {
    return null
  }
}
