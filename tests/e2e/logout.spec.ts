import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'

/**
 * Logout ends the MitID session everywhere (security fix).
 *
 * Mikkel signs in on /demo/klage (persona mismatch: the scenario is built for
 * Birthe), presses "Log af og log ind som Birthe Jensen" and is sent through
 * the backend RP-initiated logout. Afterwards:
 *  - his old workflow id is revoked (GET /mitid/session/{id} -> 404),
 *  - the IdP shows an empty username field (no remembered user),
 *  - Birthe signs in and sees her own cases with no mismatch warning.
 *
 * Full auth only (E2E_FULL_AUTH=1): needs Keycloak on localhost:8080 and the
 * backend DDEV for the case seed.
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const API_BASE = process.env.API_BASE || 'https://aabenforms.ddev.site'
const KC_AUTH = /realms\/danish-gov-test\/protocol\/openid-connect\/auth/

test.describe('Logout - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(120000)

  test('logout revokes the session and ends the IdP session', async ({ page, context, request }) => {
    execSync('cd ../backend && ddev drush aabenforms:demo:seed-klage-case --reset 2>&1')

    await context.clearCookies()
    await page.goto('/demo/klage', { waitUntil: 'networkidle' })

    // Mikkel signs in.
    await page.getByRole('button', { name: /Log ind med MitID/i }).click()
    await page.waitForURL(KC_AUTH, { timeout: 15000 })
    await page.fill('#username', 'mikkel.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage/, { timeout: 20000 })
    const mismatch = page.getByTestId('demo-persona-mismatch')
    await expect(mismatch).toBeVisible({ timeout: 15000 })
    const mikkelSession = await page.evaluate(() => localStorage.getItem('auth_session_id'))
    expect(mikkelSession).toMatch(/^wf_[a-f0-9]{32}$/)
    expect((await request.get(`${API_BASE}/mitid/session/${mikkelSession}`, { ignoreHTTPSErrors: true })).status()).toBe(200)

    // Full logout: revoke + IdP end_session, back on the demo page.
    await mismatch.getByRole('button', { name: 'Log af og log ind som Birthe Jensen' }).click()
    await page.waitForURL(/protocol\/openid-connect\/logout/, { timeout: 15000 }).catch(() => {})
    await page.waitForURL(/\/demo\/klage(\?|$)/, { timeout: 20000 })
    expect(await page.evaluate(() => localStorage.getItem('auth_session_id'))).toBeNull()
    expect((await request.get(`${API_BASE}/mitid/session/${mikkelSession}`, { ignoreHTTPSErrors: true })).status()).toBe(404)

    // The IdP no longer remembers Mikkel: a plain username field.
    await page.getByRole('button', { name: /Log ind med MitID/i }).click()
    await page.waitForURL(KC_AUTH, { timeout: 15000 })
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#username')).toHaveValue('')
    // Keycloak's "remembered user" view renders #kc-attempted-username.
    await expect(page.locator('#kc-attempted-username')).toHaveCount(0)
    await expect(page.getByText(/re-authenticate/i)).toHaveCount(0)

    // Birthe signs in and sees her own cases.
    await page.fill('#username', 'birthe.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('demo-persona-mismatch')).toHaveCount(0)
    await expect(page.locator('.form-group-radio input[type="radio"]:not(:disabled)').first()).toBeVisible()
  })
})
