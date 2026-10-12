import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'
import { expectSessionHiddenFromPage, sessionFromCookie, watchResponsesForSessionIds } from '../fixtures/session'

/**
 * Logout ends the MitID session everywhere (security fix).
 *
 * Mikkel signs in on /demo/klage (persona mismatch: the scenario is built for
 * Birthe; he picks "Ikke dig?" at the IdP) and sees the mismatch warning. When
 * the page loads again with his session, it runs the backend RP-initiated
 * logout automatically. Afterwards:
 *  - his old workflow id is revoked (GET /api/mitid/session -> 401),
 *  - the IdP only shows Birthe's suggested username (no remembered user),
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
    const leakedResponses = watchResponsesForSessionIds(page)
    await page.goto('/demo/klage', { waitUntil: 'networkidle' })

    // Mikkel signs in on Birthe's scenario: the button suggests Birthe, he
    // picks "Ikke dig?" at the IdP and types his own username.
    await page.getByRole('button', { name: 'Log ind som Birthe Jensen' }).click()
    await page.waitForURL(KC_AUTH, { timeout: 15000 })
    await expect(page.locator('#kc-hinted-username')).toHaveText('birthe.jensen')
    await page.locator('#kc-restart-login').click() // "Ikke dig? Start forfra"
    await page.fill('#username', 'mikkel.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage/, { timeout: 20000 })
    // He chose this login here, so the page warns instead of logging out.
    const mismatch = page.getByTestId('demo-persona-mismatch')
    await expect(mismatch).toBeVisible({ timeout: 15000 })
    const mikkelSession = await sessionFromCookie(context)
    expect(mikkelSession).toMatch(/^wf_[a-f0-9]{32}$/)
    // HttpOnly: never readable by page JavaScript, never in the URL.
    await expectSessionHiddenFromPage(page)
    const sessionOf = (sid: string) => request.get(`${API_BASE}/api/mitid/session`, { headers: { Authorization: `Bearer ${sid}` }, ignoreHTTPSErrors: true })
    expect((await sessionOf(mikkelSession!)).status()).toBe(200)

    // Loading the page again with the wrong persona signed in does the full
    // logout automatically: revoke + IdP end_session, back on the demo page.
    await page.reload()
    await page.waitForURL(/protocol\/openid-connect\/logout/, { timeout: 15000 }).catch(() => {})
    await page.waitForURL(/\/demo\/klage(\?|$)/, { timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Log ind som Birthe Jensen' })).toBeVisible({ timeout: 15000 })
    expect(await sessionFromCookie(context)).toBeNull()
    expect((await sessionOf(mikkelSession!)).status()).toBe(401)

    // The IdP no longer remembers Mikkel: only Birthe's suggested username.
    await page.getByRole('button', { name: 'Log ind som Birthe Jensen' }).click()
    await page.waitForURL(KC_AUTH, { timeout: 15000 })
    await expect(page.locator('#kc-hinted-username')).toHaveText('birthe.jensen')
    // Keycloak's "remembered user" view renders #kc-attempted-username.
    await expect(page.locator('#kc-attempted-username')).toHaveCount(0)
    await expect(page.getByText(/re-authenticate/i)).toHaveCount(0)
    await expect(page.getByText('mikkel.jensen', { exact: true })).toHaveCount(0)

    // Birthe types only her password and sees her own cases.
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('demo-persona-mismatch')).toHaveCount(0)
    await expect(page.locator('.form-group-radio input[type="radio"]:not(:disabled)').first()).toBeVisible()
    await expectSessionHiddenFromPage(page)
    // No response the browser received carried a session id.
    expect(leakedResponses()).toEqual([])
  })
})
