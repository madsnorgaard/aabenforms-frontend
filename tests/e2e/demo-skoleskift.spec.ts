import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { expectSessionHiddenFromPage, watchResponsesForSessionIds } from '../fixtures/session'

/**
 * /demo/skoleskift on the guided scenario wizard (issue #68).
 *
 *  - Smoke (default): the hub card links to the wizard, which renders step 1.
 *  - Full (E2E_FULL_AUTH=1): Freja logs in through the themed Keycloak,
 *    picks Emil (custody from CPR Familie+), chooses schools and a reason and
 *    submits; the flow sends Lars a co-sign invitation. Then "Fortsæt som
 *    Lars": Lars logs in, opens the invitation in his own Digital Post and
 *    follows its link to the backend's /parent-approval route, logs in with
 *    MitID there and approves. The backend returns him to his receipt on the
 *    frontend (loaded with his own MitID session). "Fortsæt som skoleleder":
 *    the school leader logs in to the backend case handling with a Drupal
 *    staff account (skoleleder, created by drush
 *    aabenforms:demo:ensure-skoleleder) and approves; the decision flow's
 *    employee gate passes for that user and the decision letter goes to both
 *    parents. Back on Lars' page the ending shows the klagefrist, and both
 *    parents' Digital Post holds the letter (Freja's checked through a
 *    drush-seeded session, DDEV only). Run on the host network so the browser
 *    reaches localhost:8080. SCREENSHOT_DIR stores the steps at 1400x900.
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time (the
 * shared demo flag).
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Skoleskift med to forældre'
const API_BASE = process.env.API_BASE || 'https://aabenforms.ddev.site'
const BACKEND_DIR = process.env.BACKEND_DIR || '../backend'
const LEADER_PASSWORD = process.env.E2E_SKOLELEDER_PASSWORD || 'test1234'

/** Recent Digital Post subjects for a persona, via a drush-seeded session (DDEV only). */
async function recentSubjects(request: any, persona: string): Promise<{ subject: string, created: number }[]> {
  const out = execSync(`ddev drush aabenforms:seed-mitid-session ${persona} 2>&1`, { cwd: BACKEND_DIR }).toString()
  const sid = /Workflow id:\s*(\S+)/.exec(out)?.[1]
  expect(sid, out).toBeTruthy()
  const res = await request.get(`${API_BASE}/api/digital-post/recent?limit=5`, { headers: { Authorization: `Bearer ${sid}` }, ignoreHTTPSErrors: true })
  expect(res.ok()).toBeTruthy()
  return ((await res.json()).data ?? []).map((l: any) => ({ subject: l.subject, created: l.created }))
}

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
  // login_hint prefills the username; type it only when it is not.
  const field = page.locator('#username')
  if (await field.isVisible()) await field.fill(username)
  else await expect(page.locator('#kc-hinted-username')).toHaveText(username)
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
    await expect(page.getByRole('heading', { name: 'Du er Freja Nielsen i denne demo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log ind som Freja Nielsen' })).toBeVisible()
    await expect(page.getByText('Mock-MitID-kodeord: test1234')).toBeVisible()
    // Step 1, the login step, is the first page a citizen sees.
    await scan(page)
  })
})

test.describe('Skoleskift demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(300000)

  test('freja applies, lars co-signs, the school leader decides, both parents get the letter', async ({ page, context }) => {
    await page.setViewportSize({ width: 1400, height: 900 })
    const leakedResponses = watchResponsesForSessionIds(page)
    await page.goto('/demo/skoleskift', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText(TITLE)
    // Answer the cookie banner once so it does not cover the screenshots.
    const noCookies = page.getByRole('button', { name: 'Nej tak til cookies' })
    if (await noCookies.isVisible().catch(() => false)) await noCookies.click()

    await page.getByRole('button', { name: 'Log ind som Freja Nielsen' }).click()
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
    // Current school is fetched (STIL, demo) for the chosen child, not asked.
    const schoolRow = table.locator('tr[data-prefill-key="current_school"]')
    await expect(schoolRow).toContainText('Frederiksbjerg Skole')
    await expect(schoolRow).toContainText('STIL')
    await expect(schoolRow).toContainText('DEMO')
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-step2.png`, fullPage: true })

    // Step 3: validation, axe, then schools and reason.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(currentStep(page)).toHaveText('Det kun du ved')
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(2)
    await scan(page)
    await expect(page.getByLabel('Nuværende skole')).toHaveCount(0)
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
    // Full logout of Freja (app + mock-MitID), then Lars' own one-click login.
    await page.getByRole('button', { name: 'Fortsæt som Lars' }).click()
    await page.waitForURL(/\/demo\/skoleskift\?som=lars/, { timeout: 30000 })
    await page.getByRole('button', { name: /Log ind som Lars/ }).click()
    await keycloakLogin(page, 'lars.andersen')
    await page.waitForURL(/\/demo\/skoleskift\?som=lars/, { timeout: 20000 })
    await expect(page.locator('h1')).toHaveText('Lars medunderskriver')
    await expect(page.getByRole('heading', { name: 'Sagen venter på din underskrift' })).toBeVisible({ timeout: 15000 })

    // Lars' own Digital Post holds the invitation with the signed link.
    const letter = page.locator('.demo-inbox__item', { hasText: 'Medunderskrift: ansøgning om skoleskift' }).first()
    await expect(letter).toBeVisible({ timeout: 15000 })
    // Only this run's invitation, never letters from earlier runs.
    await expect(page.locator('.demo-inbox__item')).toHaveCount(1)
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
    await page.locator('form input[type="submit"], form button[type="submit"]').last().click()
    // Back on the frontend: Lars' receipt, from his own MitID session.
    await page.waitForURL(/\/demo\/skoleskift\?som=lars&medunderskrevet=1/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Medunderskrift modtaget' })).toBeVisible({ timeout: 15000 })
    const receipt = page.locator('[data-testid="skoleskift-receipt"]')
    await expect(receipt.getByTestId('skoleskift-receipt-status')).toHaveText('Klar til skoleleders afgørelse')
    await expect(receipt.getByTestId('skoleskift-receipt-signed')).toHaveText('Freja Nielsen og Lars Andersen')
    const caseNumber = (await receipt.getByTestId('skoleskift-receipt-case').innerText()).trim()
    expect(caseNumber).toMatch(/^#\d+$/)
    await expect(page.locator('body')).not.toContainText(/\d{6}-?\d{4}/)
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-lars-receipt.png`, fullPage: true })

    // The school leader: a Drupal staff login on the backend, not MitID.
    await page.getByTestId('skoleskift-continue-leader').click()
    await page.waitForURL(/\/demo\/skoleskift\?som=skoleleder/)
    await expect(page.locator('h1')).toHaveText('Skolelederen træffer afgørelse')
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-leader-intro.png`, fullPage: true })
    // The leader receives the case_handler_notice mail in a simulated work inbox.
    const mail = page.getByTestId('work-mail-message')
    await expect(mail).toBeVisible()
    await expect(mail.getByTestId('work-mail-link')).toHaveText('Åbn sagen i sagsbehandlingen')
    await mail.getByTestId('work-mail-link').click()
    await page.waitForURL(/\/user\/login/, { timeout: 15000, waitUntil: 'domcontentloaded' })
    await page.fill('#edit-name', 'skoleleder')
    await page.fill('#edit-pass', LEADER_PASSWORD)
    await page.locator('#edit-submit').click()
    await page.waitForURL(/\/sagsbehandling\/skoleskift(\?|$)/, { timeout: 15000, waitUntil: 'domcontentloaded' })
    const row = page.locator('[data-testid="skoleskift-inbox"] tr', { hasText: caseNumber })
    await expect(row).toContainText('Emil Nielsen Andersen')
    await expect(row).toContainText('Freja Nielsen')
    await expect(row).toContainText('Lars Andersen')
    await row.getByRole('link', { name: 'Åbn sag' }).click()
    await page.waitForURL(/\/sagsbehandling\/skoleskift\/\d+$/, { waitUntil: 'domcontentloaded' })
    const decision = page.locator('[data-testid="skoleskift-decision"]')
    await expect(decision).toContainText(`Sag ${caseNumber}`)
    await expect(decision).toContainText(/\d{6}-XXXX/)
    await expect(decision).not.toContainText(/\d{6}-?\d{4}(?!X)/)
    await expect(decision).toContainText('Risskov Skole')
    // Afvis requires a begrundelse (the browser blocks the empty field; the
    // server-side check is covered by SchoolTransferReceiptTest).
    await page.getByLabel('Afvis').check()
    const reason = page.locator('textarea[name="rejection_reason"]')
    await expect(reason).toBeVisible()
    await page.getByRole('button', { name: 'Send afgørelse' }).click()
    expect(await reason.evaluate((el: HTMLTextAreaElement) => el.validity.valueMissing)).toBe(true)
    await expect(page).toHaveURL(/\/sagsbehandling\/skoleskift\/\d+$/)
    await page.getByLabel('Godkend skoleskift').check()
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-leader-decision.png`, fullPage: true })
    // Honeypot covers every Drupal form (time limit), staff forms included.
    const decidedAt = Math.floor(Date.now() / 1000) - 5
    await page.getByRole('button', { name: 'Send afgørelse' }).click()
    await page.waitForURL(/\/sagsbehandling\/skoleskift\/\d+\/afgjort/, { waitUntil: 'domcontentloaded' })
    const decided = page.locator('[data-testid="skoleskift-decided"]')
    await expect(decided).toContainText('Afgørelsen er registreret på sagen')
    await expect(decided).toContainText('Skoleskift godkendt')
    await expect(decided).toContainText('Freja Nielsen, Lars Andersen')

    // Sign the leader out; back to Lars' page for the ending.
    await page.getByRole('button', { name: 'Log ud og vend tilbage til demoen' }).click()
    await page.waitForURL(/\/demo\/skoleskift\?som=lars&afgjort=1/, { timeout: 20000 })
    const ending = page.locator('[data-testid="skoleskift-ending"]')
    await expect(ending.getByRole('heading', { name: 'Afgørelsen er sendt til begge forældre' })).toBeVisible({ timeout: 15000 })
    await expect(ending).toContainText('Freja Nielsen og Lars Andersen')
    await expect(page.getByTestId('skoleskift-klagefrist')).toContainText(/senest \d{1,2}\. \w+ \d{4}/)
    await expect(page.getByTestId('skoleskift-receipt-status')).toHaveText('Skoleskift godkendt')
    await expect(page.locator('.demo-inbox__item', { hasText: 'Afgørelse: skoleskift' }).first()).toBeVisible({ timeout: 15000 })
    // Exactly this case's two letters: the invitation and the decision.
    await expect(page.locator('.demo-inbox__item')).toHaveCount(2)
    // Two MitID logins, a submit, a co-sign and the inbox: page JavaScript
    // never held a session id, and no response carried one (#252).
    await expectSessionHiddenFromPage(page)
    expect(leakedResponses()).toEqual([])
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/skoleskift-ending.png`, fullPage: true })

    // Both parents' Digital Post holds the decision letter.
    for (const persona of ['freja', 'lars']) {
      const letters = await recentSubjects(page.request, persona)
      expect(letters.some((l) => l.subject === 'Afgørelse: skoleskift' && l.created >= decidedAt), `${persona}: ${JSON.stringify(letters)}`).toBeTruthy()
    }

    // Run the whole demo again: full logout, back to Freja's start.
    await page.getByRole('button', { name: 'Kør hele demoen igen' }).click()
    // The logout POST carries the SPA's own session, so the IdP gets an
    // id_token_hint: no click on Keycloak's "Do you want to log out?" page
    // is needed (it would hold the browser there and time this out).
    await page.waitForURL(/\/demo\/skoleskift\/?$/, { timeout: 30000 })
    await expect(page.getByRole('button', { name: 'Log ind som Freja Nielsen' })).toBeVisible({ timeout: 15000 })
  })
})
