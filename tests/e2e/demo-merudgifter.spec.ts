import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/merudgifter on the guided scenario wizard (SEL §41, issue #67).
 *
 *  - Smoke (default): the hub card links to the wizard, which renders step 1.
 *  - Full (E2E_FULL_AUTH=1): logs in as freja.nielsen through the themed
 *    Keycloak, picks Emil from the CPR Familie+ options (no income row:
 *    SEL §41 does not depend on income), types the need and
 *    2.500 kr/md (medhold), then runs again with 800 kr/md (partshøring,
 *    afslag, klagefrist). Run on the host network so the browser reaches
 *    localhost:8080. SCREENSHOT_DIR stores step 2 and step 5 at 1400x900.
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time (the
 * shared demo flag).
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Merudgifter til et barn med handicap'

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

async function step2ChooseEmil(page: any) {
  await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
  const table = page.locator('table.demo-provenance__table')
  await expect(table).toBeVisible({ timeout: 15000 })
  await expect(table.locator('tr[data-prefill-key="applicant_cpr"]')).toContainText(/\d{6}-XXXX/)
  await expect(table.locator('tr[data-prefill-key="applicant_cpr"] .badge')).toHaveText('LIVE-PARAT')
  await expect(table.locator('tr[data-prefill-key="child_cpr"] .badge')).toHaveText('DEMO')
  // SEL §41 does not depend on the parents' income: it is never fetched.
  await expect(table.locator('tr[data-prefill-key="household_income"]')).toHaveCount(0)
  await page.getByRole('radio', { name: /Emil/ }).check()
}

async function fillAndSubmit(page: any, amount: string) {
  if (await page.getByRole('button', { name: 'Fortsæt' }).isVisible()) {
    await page.getByRole('button', { name: 'Fortsæt' }).click()
  }
  await expect(currentStep(page)).toHaveText('Det kun du ved')
  await page.locator('textarea').fill('Autisme. Behov for specialkost, ekstra transport til behandling og slid på tøj.')
  await page.getByLabel(/Anslåede nødvendige merudgifter/).fill(amount)
  await page.getByRole('button', { name: /Indsend ansøgning/i }).click()
  await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
  await expect(page.locator('#demo-step-letter')).toBeVisible({ timeout: 30000 })
  await expect(page.getByRole('button', { name: 'Kør igen' })).toBeVisible({ timeout: 20000 })
  await expect(currentStep(page)).toHaveText('Digital Post')
}

test.describe('Merudgifter demo - smoke', () => {
  test('hub card links to the wizard', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle', timeout: 20000 })
    const card = page.locator('.card', { has: page.getByRole('heading', { name: TITLE }) })
    await expect(card).toBeVisible()
    await card.getByRole('link', { name: `Prøv ${TITLE}` }).click()
    await page.waitForURL(/\/demo\/merudgifter/)
    await expect(page.locator('h1')).toHaveText(TITLE)
    await expect(page.locator('nav[aria-label="Trinindikator"] ol.step-indicator > li')).toHaveCount(5)
    await expect(page.getByRole('heading', { name: 'Du er Freja Nielsen i denne demo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log ind som Freja Nielsen' })).toBeVisible()
    await expect(page.getByText('Mock-MitID-kodeord: test1234')).toBeVisible()
    // Step 1, the login step, is the first page a citizen sees.
    await scan(page)
  })
})

test.describe('Merudgifter demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(150000)

  test('freja chooses Emil: 2.500 kr gives medhold, 800 kr gives afslag', async ({ page }) => {
    await page.context().clearCookies()
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/demo/merudgifter', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText(TITLE)

    await page.getByRole('button', { name: 'Log ind som Freja Nielsen' }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    if (await page.locator('#username').isVisible()) await page.fill('#username', 'freja.nielsen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/merudgifter/, { timeout: 20000 })

    // Step 2: children as a radio choice, no income row.
    await step2ChooseEmil(page)
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/merudgifter-step2.png`, fullPage: true })

    // Step 3: validation, then axe.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(currentStep(page)).toHaveText('Det kun du ved')
    await expect(page.locator('#demo-merudgifter-maanedlig_merudgift-hint')).toContainText('1.000 kr./md.')
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(2)
    await scan(page)
    // Run 1: 2.500 kr/md -> medhold.
    await fillAndSubmit(page, '2500')
    await expect(page.getByRole('heading', { name: 'Medhold: merudgifterne dækkes' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Afgørelse: bevilling af merudgiftsydelse (servicelovens §41)').first()).toBeVisible()
    await expect(page.getByText(/imødekommet \(medhold\)/).first()).toBeAttached()
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/merudgifter-step5.png`, fullPage: true })

    // Run 2: 800 kr/md -> partshøring, afslag, klagefrist.
    await page.getByRole('button', { name: 'Kør igen' }).click()
    await step2ChooseEmil(page)
    await fillAndSubmit(page, '800')
    await expect(page.getByText('Partshøring').first()).toBeVisible()
    await expect(page.getByText(/klagefrist/i).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Afslag med klagevejledning' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/ikke imødekommet \(afslag\)/).first()).toBeAttached()
    // The rejection letter itself carries the reason and the klagevejledning
    // (forvaltningsloven §25), not a reference to an attachment.
    const afslag = page.locator('.demo-inbox__item', { hasText: 'Afgørelse: afslag på merudgiftsydelse' }).first()
    await afslag.locator('summary').click()
    await expect(afslag).toContainText('800 kr. om måneden')
    await expect(afslag).toContainText('Klagevejledning')
    await expect(afslag).toContainText('senest 4 uger efter, at du har modtaget afgørelsen')
    await expect(afslag).not.toContainText('vedlagte')
  })
})
