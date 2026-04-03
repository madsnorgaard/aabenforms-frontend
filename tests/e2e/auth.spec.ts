import { test, expect } from '@playwright/test'
import { testUsers, loginWithMitId } from '../fixtures/test-helpers'

test.describe('MitID Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('MitID login button is visible on landing page', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /MitID/i })
    await expect(loginButton).toBeVisible()
  })

  test('clicking MitID button redirects to Keycloak', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /MitID/i })
    await loginButton.click()

    // Should navigate to Keycloak login page
    await page.waitForURL(/localhost:8080|keycloak/, { timeout: 15000 })

    // Keycloak login form should be visible
    await expect(page.locator('#username, #kc-form-login')).toBeVisible({ timeout: 10000 })
  })

  test('full login flow with test user freja.nielsen', async ({ page }) => {
    await loginWithMitId(page, testUsers.citizen)

    // After successful login, should be back on the frontend
    await expect(page).toHaveURL(/aabenforms/)

    // User should see their name or a user menu indicator
    // (The exact UI depends on whether the auth callback page redirects)
  })

  test('Keycloak shows Danish test realm login page', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /MitID/i })
    await loginButton.click()

    await page.waitForURL(/localhost:8080/, { timeout: 15000 })

    // The realm should be "danish-gov-test"
    const pageUrl = page.url()
    expect(pageUrl).toContain('danish-gov-test')
  })
})

test.describe('MitID Authentication - Protected Routes', () => {
  test('unauthenticated user redirected from /workflows/tasks', async ({ page }) => {
    await page.goto('/workflows/tasks')

    // Should redirect to home with auth=required query param
    // or show login required message
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url.includes('auth=required') || url === '/' || url.endsWith('/en')).toBeTruthy()
  })
})

test.describe('MitID Authentication - Multiple Personas', () => {
  test('can log in as business owner (karen.christensen)', async ({ page }) => {
    await page.goto('/')
    await loginWithMitId(page, testUsers.businessOwner)

    // Should complete auth without errors
    await expect(page).toHaveURL(/aabenforms/)
  })
})
