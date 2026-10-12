import { test, expect, type Page } from '@playwright/test'
import { testUsers, type TestUser } from '../fixtures/test-helpers'
import { expectSessionHiddenFromPage, sessionFromCookie } from '../fixtures/session'

/**
 * MitID authentication from the /forms/<id> identity gate.
 *
 * The landing page has no MitID button any more (PR #80); login lives on the
 * demo pages (covered by demo-*.spec.ts and logout.spec.ts) and on the gate a
 * MitID-gated form shows instead of its fields. This spec covers the gate:
 *  - Smoke (default): an anonymous visitor sees the gate, not the fields, and
 *    protected routes send them away.
 *  - Full (E2E_FULL_AUTH=1): the gate button goes to the mock-MitID Keycloak
 *    realm, the persona logs in, and the browser returns to the same form with
 *    the session (an HttpOnly cookie page JavaScript cannot read, never in
 *    the URL or storage) and the fields.
 *    Needs host-network access to localhost:8080.
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const KC_AUTH = /realms\/danish-gov-test\/protocol\/openid-connect\/auth/

const gateButton = (page: Page) => page.getByRole('button', { name: 'Log ind med MitID' })

async function openGate(page: Page, formId: string) {
  await page.goto(`/forms/${formId}`, { waitUntil: 'networkidle', timeout: 30000 })
  await expect(page.locator('.mitid-gate')).toBeVisible({ timeout: 15000 })
}

/** Logs in through the form gate and returns the session id the SPA holds. */
async function loginThroughGate(page: Page, formId: string, user: TestUser): Promise<string> {
  await openGate(page, formId)
  await gateButton(page).click()
  await page.waitForURL(KC_AUTH, { timeout: 20000 })
  await expect(page.locator('#kc-form-login')).toBeVisible()
  await page.fill('#username', user.username)
  await page.fill('#password', user.password)
  await page.click('#kc-login')
  // Back on the same form, not on the landing page.
  await page.waitForURL(new RegExp(`/forms/${formId}(\\?|$)`), { timeout: 30000 })
  await expect(page.locator('.mitid-session-banner')).toContainText(user.name, { timeout: 15000 })
  const sid = await sessionFromCookie(page.context())
  expect(sid).toMatch(/^wf_/)
  // The session id never reaches page JavaScript: not in a URL, a readable
  // cookie or storage.
  await expectSessionHiddenFromPage(page)
  return sid!
}

test.describe('MitID gate - anonymous', () => {
  test('a MitID-gated form shows the login gate instead of its fields', async ({ page }) => {
    await openGate(page, 'address_change')
    await expect(page.getByText('Denne ansøgning kræver, at du bekræfter din identitet med MitID')).toBeVisible()
    await expect(gateButton(page)).toBeVisible()
    await expect(page.locator('.form-fields')).toHaveCount(0)
    await expect(page.locator('main input:not([type="hidden"])')).toHaveCount(0)
  })

  test('unauthenticated user redirected from /workflows/tasks', async ({ page }) => {
    await page.goto('/workflows/tasks', { waitUntil: 'networkidle', timeout: 30000 })
    const url = page.url()
    const path = new URL(url).pathname
    const redirected = url.includes('auth=required') || /^\/(en|da)?\/?$/.test(path)
    expect(redirected, `still on ${url}`).toBeTruthy()
  })
})

test.describe('MitID gate - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(90000)

  test('citizen freja.nielsen logs in from the gate and gets the form fields', async ({ page }) => {
    await loginThroughGate(page, 'address_change', testUsers.citizen)
    await expect(page.locator('.form-fields')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /CPR/ })).toBeVisible()
    await expect(gateButton(page)).toHaveCount(0)
  })

  test('business owner karen.christensen logs in from the CVR form gate', async ({ page }) => {
    await loginThroughGate(page, 'company_verification', testUsers.businessOwner)
    await expect(page.locator('.form-fields')).toBeVisible()
    await expect(gateButton(page)).toHaveCount(0)
  })
})
