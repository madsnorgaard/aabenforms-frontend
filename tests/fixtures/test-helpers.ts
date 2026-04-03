import { type Page, expect } from '@playwright/test'

/**
 * Test user personas from the Keycloak mock realm.
 * All passwords are 'test1234'.
 */
export const testUsers = {
  citizen: {
    username: 'freja.nielsen',
    password: 'test1234',
    cpr: '0101904521',
    name: 'Freja Nielsen',
    role: 'user',
  },
  businessOwner: {
    username: 'karen.christensen',
    password: 'test1234',
    cpr: '1205705432',
    name: 'Karen Christensen',
    role: 'business',
    cvr: '12345678',
  },
  parent1: {
    username: 'sofie.hansen',
    password: 'test1234',
    cpr: '2506924015',
    name: 'Sofie Hansen',
    role: 'user',
  },
  parent2: {
    username: 'lars.andersen',
    password: 'test1234',
    cpr: '0803755210',
    name: 'Lars Andersen',
    role: 'user',
  },
  protectedPerson: {
    username: 'protected.person',
    password: 'test1234',
    cpr: '0101804321',
    name: 'Protected Person',
    role: 'user',
  },
} as const

export type TestUser = typeof testUsers[keyof typeof testUsers]

/**
 * Log in via Keycloak mock (MitID simulator).
 * Handles the full redirect chain: frontend -> backend -> Keycloak -> backend -> frontend.
 */
export async function loginWithMitId(page: Page, user: TestUser = testUsers.citizen) {
  // Click the MitID login button
  await page.getByRole('button', { name: /MitID/i }).click()

  // Wait for Keycloak login page
  await page.waitForURL(/keycloak|localhost:8080/, { timeout: 15000 })

  // Fill Keycloak credentials
  await page.fill('#username', user.username)
  await page.fill('#password', user.password)
  await page.click('#kc-login')

  // Wait for redirect back to frontend
  await page.waitForURL(/auth\/callback|session=/, { timeout: 15000 })

  // Wait for auth to complete (callback page processes and redirects)
  await page.waitForTimeout(2000)
}

/**
 * Assert no console errors on page (excluding known benign errors).
 */
export async function assertNoConsoleErrors(page: Page) {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Ignore known benign errors
      if (
        text.includes('WebSocket') ||
        text.includes('vite') ||
        text.includes('favicon')
      ) {
        return
      }
      errors.push(text)
    }
  })

  // Give a moment for any async errors
  await page.waitForTimeout(1000)

  expect(errors, 'Unexpected console errors').toEqual([])
}

/**
 * Submit a webform to the backend API directly.
 */
export async function submitWebform(
  apiBase: string,
  webformId: string,
  data: Record<string, string>
) {
  const response = await fetch(`${apiBase}/api/webform/${webformId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ data }),
  })

  return response.json()
}
