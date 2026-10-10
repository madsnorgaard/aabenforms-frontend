import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/klage on the guided scenario wizard (issue #70, digital inklusion).
 *
 *  - Smoke (default): the hub card links to the wizard, which renders step 1.
 *  - Full (E2E_FULL_AUTH=1): resets Birthe's demo case (drush, backend DDEV),
 *    logs in as birthe.jensen, picks the appealable case, types the reason
 *    and follows klage_flow (verify_ownership -> case_appeal) to step 5.
 *    No Digital Post letter is expected: Birthe is exempt (backend #242).
 *    SCREENSHOT_DIR stores step 2 and step 5 at 1400x900.
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time (the
 * shared demo flag).
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Klage over en afgørelse'

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

async function scan(page: any) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
  expect(violations, formatViolations(violations)).toEqual([])
}

const currentStep = (page: any) => page.locator('ol.step-indicator li.current .step-title').first()

test.describe('Klage demo - smoke', () => {
  test('hub card links to the wizard', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle', timeout: 20000 })
    const card = page.locator('.card', { has: page.getByRole('heading', { name: TITLE }) })
    await expect(card).toBeVisible()
    await card.getByRole('link', { name: `Prøv ${TITLE}` }).click()
    await page.waitForURL(/\/demo\/klage/)
    await expect(page.locator('h1')).toHaveText(TITLE)
    await expect(page.locator('nav[aria-label="Trinindikator"] ol.step-indicator > li')).toHaveCount(5)
    await expect(page.getByText('birthe.jensen')).toBeVisible()
    await expect(page.getByText(/logger aldrig ind som sin mor/)).toBeVisible()
  })
})

test.describe('Klage demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(150000)

  test('birthe appeals her afslag; the case becomes Påklaget', async ({ page, context }) => {
    // A fresh appealable case (only created when none is appealable).
    const seed = execSync('cd ../backend && ddev drush aabenforms:demo:seed-klage-case --reset 2>&1').toString()
    const caseId = seed.match(/#(\d+)/)?.[1]
    expect(caseId, seed).toBeTruthy()

    await context.clearCookies()
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/demo/klage', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText(TITLE)

    await page.getByRole('button', { name: /Log ind med MitID/i }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    if (await page.locator('#username').isVisible()) await page.fill('#username', 'birthe.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage/, { timeout: 20000 })

    // Step 2: identity + the case register as a radio choice.
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    const table = page.locator('table.demo-provenance__table')
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"]')).toContainText(/\d{6}-XXXX/)
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"] .badge')).toHaveText('LIVE-PARAT')
    await expect(table.locator('tr[data-prefill-key="case_id"] .badge')).toHaveText('LIVE')
    await expect(page.getByText(/fritaget fra Digital Post/).first()).toBeVisible()
    const option = page.locator('.form-group-radio', { has: page.locator('.form-hint', { hasText: new RegExp(`^${caseId} - `) }) })
    await option.locator('input[type="radio"]').check()
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/klage-step2.png`, fullPage: true })

    // Step 3: only the reason; validation, then axe.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(currentStep(page)).toHaveText('Det kun du ved')
    await expect(page.locator('textarea')).toHaveCount(1)
    await page.getByRole('button', { name: /Indsend/i }).click()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(1)
    await scan(page)
    await page.locator('textarea').fill('Afslaget bygger på et for lavt beløb. Udgifterne til medicin og transport er over 1.000 kr. om måneden, så jeg bør have medhold.')
    await page.getByRole('button', { name: /Indsend/i }).click()

    // Step 4: ownership verified, appeal registered.
    await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.demo-wizard__step')).not.toHaveCount(0)
    await expect(page.locator('.demo-wizard__step-error')).toHaveCount(0)

    // Step 5: no letter is expected; the case status is the receipt.
    await expect(page.locator('#demo-step-letter')).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('button', { name: 'Kør igen' })).toBeVisible({ timeout: 30000 })
    await expect(currentStep(page)).toHaveText('Digital Post')
    await expect(page.getByText(/Her forventes intet brev/)).toBeVisible()
    const status = execSync(`cd ../backend && ddev drush php:eval "echo \\Drupal::entityTypeManager()->getStorage('aabenforms_case')->load(${caseId})->get('status')->value;" 2>/dev/null`).toString().trim()
    expect(status).toBe('paaklaget')
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/klage-step5.png`, fullPage: true })
  })
})
