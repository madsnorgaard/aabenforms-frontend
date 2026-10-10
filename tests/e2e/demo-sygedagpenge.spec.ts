import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/sygedagpenge on the guided scenario wizard.
 *
 *  - Smoke (default): the hub card links to the wizard, which renders step 1.
 *  - Full (E2E_FULL_AUTH=1): logs in as mikkel.jensen, sees employer, the
 *    beskæftigelseskrav and the first sick day fetched (eIndkomst and
 *    NemRefusion, both demo), types what he cannot do, and gets the medhold
 *    letter with the date of the first opfølgningssamtale. axe WCAG 2.1 AA
 *    on steps 2, 3 and 5. SCREENSHOT_DIR stores steps 2 and 5 at 1400x900.
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time (the
 * shared demo flag).
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Sygedagpenge'

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

test.describe('Sygedagpenge demo - smoke', () => {
  test('hub card links to the wizard', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle', timeout: 20000 })
    const card = page.locator('[data-scenario="sygedagpenge"] .card')
    await expect(card.locator('.card-heading')).toHaveText(TITLE)
    await expect(card.locator('.tag')).toHaveText('Digital inklusion')
    await card.getByRole('link', { name: `Prøv ${TITLE}` }).click()
    await page.waitForURL(/\/demo\/sygedagpenge/)
    await expect(page.locator('h1')).toHaveText(TITLE)
    await expect(page.locator('nav[aria-label="Trinindikator"] ol.step-indicator > li')).toHaveCount(5)
    await expect(page.getByText('mikkel.jensen')).toBeVisible()
  })
})

test.describe('Sygedagpenge demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(150000)

  test('mikkel meets the employment requirement and gets the letter with the follow-up date', async ({ page }) => {
    await page.context().clearCookies()
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/demo/sygedagpenge', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText(TITLE)

    await page.getByRole('button', { name: /Log ind med MitID/i }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    if (await page.locator('#username').isVisible()) await page.fill('#username', 'mikkel.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/sygedagpenge/, { timeout: 20000 })

    const noCookies = page.getByRole('button', { name: 'Nej tak til cookies' })
    if (await noCookies.isVisible()) await noCookies.click()

    // Step 2: employer, hours requirement and first sick day are fetched.
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    const table = page.locator('table.demo-provenance__table')
    await expect(table).toBeVisible({ timeout: 15000 })
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"]')).toContainText('150285-XXXX')
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"] .badge')).toHaveText('LIVE-PARAT')
    await expect(table.locator('tr[data-prefill-key="employer_name"]')).toContainText('(demo)')
    await expect(table.locator('tr[data-prefill-key="employer_cvr"]')).toContainText('29876543')
    await expect(table.locator('tr[data-prefill-key="employment_history"]')).toContainText(/\d+ timer de seneste 6 måneder - kravet på 240 timer er opfyldt/)
    await expect(table.locator('tr[data-prefill-key="first_sick_day"]')).toContainText(/\d{1,2}\. \S+ \d{4}/)
    for (const key of ['employer_name', 'employer_cvr', 'employment_history', 'first_sick_day']) {
      await expect(table.locator(`tr[data-prefill-key="${key}"] .badge`)).toHaveText('DEMO')
    }
    await expect(page.getByText('Sygedagpengeloven §32').first()).toBeAttached()
    // Pay is never sent to the browser.
    await expect(page.getByText('31.500')).toHaveCount(0)
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/sygedagpenge-step2.png`, fullPage: true })

    // Step 3: only what the registers do not know; validation, then axe.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(currentStep(page)).toHaveText('Det kun du ved')
    await expect(page.getByText('Du skal ikke oplyse en diagnose.').first()).toBeVisible()
    await page.getByRole('button', { name: /Indsend/i }).click()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(3)
    await scan(page)

    await page.getByLabel('Hvad kan du ikke på grund af din sygdom?').fill('Jeg kan ikke løfte eller gå længe efter en knæskade.')
    await page.getByLabel('Hvor længe forventer du at være syg?').selectOption('4_8')
    await page.getByRole('radio', { name: 'Ja' }).check()
    await page.getByRole('button', { name: /Indsend/i }).click()

    // Step 4 + 5: the flow runs, the letter arrives with the follow-up date.
    await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#demo-step-letter')).toBeVisible({ timeout: 30000 })
    await expect(page.getByRole('button', { name: 'Kør igen' })).toBeVisible({ timeout: 20000 })
    await expect(currentStep(page)).toHaveText('Digital Post')
    await expect(page.getByRole('heading', { name: 'Du har ret til sygedagpenge' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Afgørelse: du har ret til sygedagpenge').first()).toBeVisible()
    await expect(page.getByText(/første opfølgningssamtale/).first()).toBeAttached()
    await expect(page.getByText(/senest \d{2}-\d{2}-\d{4} til den første opfølgningssamtale/).first()).toBeAttached()
    await scan(page)
    // Open the newest letter so the screenshot shows the plain-language body.
    await page.locator('summary', { hasText: 'Afgørelse: du har ret til sygedagpenge' }).first().click()
    await expect(page.getByText(/senest \d{2}-\d{2}-\d{4} til den første opfølgningssamtale/).first()).toBeVisible()
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/sygedagpenge-step5.png`, fullPage: true })
  })
})
