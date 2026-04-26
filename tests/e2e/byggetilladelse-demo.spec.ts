import { test, expect } from '@playwright/test'

/**
 * /demo/byggetilladelse interactive demo.
 *
 * Two modes:
 *
 *  - Smoke (default): renders the demo page and asserts the kickoff state
 *    is wired correctly. The "Start demo med MitID" button is verified to
 *    be a real anchor/button that would redirect to the backend's
 *    /mitid/login. We DO NOT follow the redirect because the containerized
 *    runner can't reach localhost:8080 (Keycloak) - that's a known
 *    constraint documented in project_aabenforms.md.
 *
 *  - Full (E2E_FULL_AUTH=1): drives a real round-trip through the themed
 *    Keycloak login as freja.nielsen, lands back at the prefilled form,
 *    submits, watches workflow-steps animate, and asserts a Digital Post
 *    letter appears. MUST be run on host network so localhost:8080 is
 *    reachable from the browser context (the containerized runner sees its
 *    own bridge network, not the host's loopback).
 *
 * Both modes require NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at
 * build/runtime; otherwise the page renders the disabled-state and these
 * tests will fail at the first assertion.
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'

test.describe('Byggetilladelse demo - smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/byggetilladelse', { waitUntil: 'networkidle', timeout: 20000 })
  })

  test('renders the kickoff page with the mock-IdP banner', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/MitID|byggetilladelse/i)
    // Mock-IdP banner must be visible on every screen of the demo.
    await expect(page.getByText(/Mock.IdP/i).first()).toBeVisible()
    // Capability badges (BPMN/ECA/MitID/Digital Post/GDPR).
    await expect(page.getByRole('button', { name: 'BPMN' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'ECA' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Digital Post/i })).toBeVisible()
  })

  test('Start demo button kicks off MitID redirect (no follow)', async ({ page }) => {
    // Intercept the navigation. We don't actually follow it - we just verify
    // the URL the browser is about to hit matches the backend mitid/login.
    const navigationPromise = page.waitForRequest(
      req => req.url().includes('/mitid/login') && req.method() === 'GET',
      { timeout: 5000 },
    ).catch(() => null)

    await page.getByRole('button', { name: /Log ind via mock.MitID/i }).click()

    const req = await navigationPromise
    expect(req, 'expected a request to /mitid/login').not.toBeNull()
    expect(req!.url()).toContain('/mitid/login')
  })
})

test.describe('Byggetilladelse demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')

  test('completes the full flow as freja.nielsen', async ({ page }) => {
    await page.goto('/demo/byggetilladelse', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toContainText(/MitID/i)

    // Kickoff -> themed Keycloak login.
    await page.getByRole('button', { name: /Log ind via mock.MitID/i }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })

    // Themed login page must show our brand banner.
    await expect(page.getByText(/Mock.IdP|Demo/i).first()).toBeVisible()

    await page.fill('#username', 'freja.nielsen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')

    // Land back on the demo with prefilled form.
    await page.waitForURL(/\/demo\/byggetilladelse/, { timeout: 20000 })
    await expect(page.getByText(/Auto.udfyldt fra MitID|Auto.filled from MitID/i).first()).toBeVisible({ timeout: 10000 })

    // Fill description and submit.
    await page.locator('textarea').fill('Tilbygning på 30 m² mod nordfacaden, etage 1.')
    await page.getByRole('button', { name: /Indsend ansøgning|Submit application/i }).click()

    // Workflow tracker animates.
    await expect(page.getByText(/Workflow|workflow/i).first()).toBeVisible({ timeout: 10000 })

    // Inbox eventually shows a letter.
    await expect(page.getByText(/Modtaget: ansøgning om byggetilladelse/i).first()).toBeVisible({ timeout: 15000 })
  })
})
