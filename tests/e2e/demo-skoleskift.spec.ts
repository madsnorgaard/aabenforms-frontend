import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/skoleskift on the guided scenario wizard (issue #68).
 *
 *  - Smoke (default): the hub card links to the wizard, which renders step 1.
 *  - Full (E2E_FULL_AUTH=1): Freja logs in through the themed Keycloak,
 *    picks Emil (custody from CPR Familie+), chooses schools and a reason and
 *    submits; the flow sends Lars a co-sign invitation. Then "Fortsæt som
 *    Lars": Lars logs in, opens the invitation in his own Digital Post and
 *    follows its link to the backend's /parent-approval route, logs in with
 *    MitID there and approves. Run on the host network so the browser
 *    reaches localhost:8080. SCREENSHOT_DIR stores step 2 and step 5 at
 *    1400x900.
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time (the
 * shared demo flag).
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Skoleskift med to forældre'

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

async function scan(page: any) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
  expect(violations, formatViolations(violations)).toEqual([])
}

async function keycloakLogin(page: any, username: string) {
  await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
  await page.fill('#username', username)
  await page.fill('#password', 'test1234')
  await page.click('#kc-login')
}

const currentStep = (page: any) => page.locator('ol.step-indicator li.current .step-title').first()

test.describe('Skoleskift demo - smoke', () => {
  test('hub card links to the wizard', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle', timeout: 20000 })
    const card = page.locator('.card', { has: page.getByRole('heading', { name: TITLE }) })
    await expect(card).toBeVisible()
    await card.getByRole('link', { name: `Prøv ${TITLE}` }).click()
    await page.waitForURL(/\/demo\/skoleskift/)
    await expect(page.locator('h1')).toHaveText(TITLE)
    await expect(page.locator('nav[aria-label="Trinindikator"] ol.step-indicator > li')).toHaveCount(5)
    await expect(page.getByText('freja.nielsen')).toBeVisible()
  })
})

test.describe('Skoleskift demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(180000)

  test('freja applies for Emil, lars co-signs from his Digital Post', async ({ page, context }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/demo/skoleskift', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText(TITLE)

    await page.getByRole('button', { name: /Log ind med MitID/i }).click()
    await keycloakLogin(page, 'freja.nielsen')
    await page.waitForURL(/\/demo\/skoleskift/, { timeout: 20000 })

    // Step 2: custody comes with the child from CPR Familie+.
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    const table = page.locator('table.demo-provenance__table')
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"]')).toContainText(/\d{6}-XXXX/)
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"] .badge')).toHaveText('LIVE-PARAT')
    await expect(table.locator('tr[data-prefill-key="child_cpr"] .badge')).toHaveText('DEMO')
    await expect(page.getByText(/fælles med Lars Andersen/).first()).toBeVisible()
    await page.getByRole('radio', { name: /Emil/ }).check()
    await expect(table.locator('tr[data-prefill-key="child_cpr"]')).toContainText('Emil Nielsen Andersen')
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-step2.png`, fullPage: true })

    // Step 3: validation, axe, then schools and reason.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(currentStep(page)).toHaveText('Det kun du ved')
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(3)
    await scan(page)
    await page.getByLabel('Nuværende skole').selectOption('751101')
    await page.getByLabel('Ønsket skole').selectOption('751104')
    await page.locator('textarea').fill('Vi er flyttet til Risskov, og skolevejen er nu over 6 km.')
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()

    // Step 4: custody verified, invitation sent.
    await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#demo-step-letter')).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('button', { name: 'Kør igen' })).toBeVisible({ timeout: 20000 })
    await expect(currentStep(page)).toHaveText('Digital Post')

    // Step 5: the invitation went to Lars; the case waits for him.
    // Freja's inbox is not awaited or warned about; the hand-over to Lars
    // sits in the main column right under the step-5 content.
    await expect(page.getByRole('heading', { name: 'Sagen venter på Lars' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Invitationen går til Lars' })).toBeVisible()
    await expect(page.getByText('Brevet er ikke nået frem endnu')).toHaveCount(0)
    const cosign = page.locator('.demo-wizard__main [data-testid="demo-skoleskift-cosign"]')
    await expect(cosign.getByRole('heading', { name: 'Lars medunderskriver' })).toBeVisible()
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-step5.png`, fullPage: true })

    // Persona switch. Real MitID has no SSO; the mock Keycloak does, so drop
    // its cookies or it would silently log Freja in again.
    await context.clearCookies()
    await page.getByRole('button', { name: 'Fortsæt som Lars' }).click()
    await keycloakLogin(page, 'lars.andersen')
    await page.waitForURL(/\/demo\/skoleskift\?som=lars/, { timeout: 20000 })
    await expect(page.locator('h1')).toHaveText('Lars medunderskriver')
    await expect(page.getByRole('heading', { name: 'Sagen venter på din underskrift' })).toBeVisible({ timeout: 15000 })

    // Lars' own Digital Post holds the invitation with the signed link.
    const letter = page.locator('.demo-inbox__item', { hasText: 'Medunderskrift: ansøgning om skoleskift' }).first()
    await expect(letter).toBeVisible({ timeout: 15000 })
    await letter.locator('summary').click()
    const link = letter.getByRole('link', { name: 'Se og underskriv anmodningen' })
    await expect(link).toHaveAttribute('href', /\/parent-approval\/2\/\d+\/[^/]+$/)
    await link.click()

    // Backend (Drupal-rendered) approval page: MitID, then the decision.
    await page.waitForURL(/\/parent-approval\/2\/\d+\//, { timeout: 15000 })
    await page.locator('a.mitid-login-button').click()
    await page.waitForURL(/(\/parent-approval\/2\/\d+\/[^/]+\/mitid\/complete|realms\/danish-gov-test)/, { timeout: 20000 })
    if (/realms\/danish-gov-test/.test(page.url())) {
      // Keycloak may already know the user from the previous step and show a
      // password-only form, so fill the username only when it is offered.
      const username = page.locator('#username')
      if (await username.isVisible({ timeout: 3000 }).catch(() => false)) await username.fill('lars.andersen')
      await page.fill('#password', 'test1234')
      await page.click('#kc-login')
    }
    await page.locator('input[name="action"][value="approve"]').check({ timeout: 20000 })
    // Honeypot rejects submissions faster than a human (time limit grows on
    // repeated fast posts), so read the page like a parent would first.
    await page.waitForTimeout(15000)
    await page.locator('form input[type="submit"], form button[type="submit"]').last().click()
    await page.waitForURL(/\/parent-approval\/complete\/approve/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Approval Complete' })).toBeVisible()
    await expect(page.getByText('Your approval has been recorded')).toBeVisible()
  })
})
