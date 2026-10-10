import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/byggetilladelse on the guided scenario wizard (DKFDS Trinindikator).
 *
 * Two modes:
 *
 *  - Smoke (default): renders the wizard and asserts step 1 is wired: the
 *    step indicator, the mock-IdP notice, the capability tags and that the
 *    MitID button redirects to the backend's /mitid/login. The redirect is
 *    NOT followed: the containerized runner cannot reach localhost:8080
 *    (Keycloak).
 *
 *  - Full (E2E_FULL_AUTH=1): drives the real round-trip through the themed
 *    Keycloak login as freja.nielsen, lands on step 2 (provenance table with
 *    the masked CPR), continues to step 3, submits, watches the workflow
 *    steps, and asserts the "Modtaget" letter in the Digital Post step. Run
 *    on the host network so the browser reaches localhost:8080.
 *
 * Both modes require NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build
 * time; otherwise the page renders the disabled state.
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

async function scan(page: any) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
  expect(violations, formatViolations(violations)).toEqual([])
}

test.describe('Byggetilladelse demo - smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/byggetilladelse', { waitUntil: 'networkidle', timeout: 20000 })
  })

  test('renders step 1 with the step indicator, mock-IdP notice and capability tags', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Byggetilladelse')
    await expect(page.locator('header .authority-name').first()).toHaveText('Demo-kommune')

    // Trinindikator: five steps, the first current.
    const steps = page.locator('nav[aria-label="Trinindikator"] ol.step-indicator > li')
    await expect(steps).toHaveCount(5)
    await expect(steps.nth(0)).toHaveClass(/current/)
    await expect(steps.nth(0).locator('.step-title')).toHaveText('Log ind med MitID')
    await expect(steps.nth(4).locator('.step-title')).toHaveText('Digital Post')

    // Persona hint and the mock-IdP notice.
    await expect(page.getByRole('heading', { name: 'Du er Freja Nielsen i denne demo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log ind som Freja Nielsen' })).toBeVisible()
    await expect(page.getByText('Mock-MitID-kodeord: test1234')).toBeVisible()
    await expect(page.getByText(/Mock.IdP/i).first()).toBeVisible()

    // Capability tags (DKFDS tags as toggle buttons).
    await expect(page.getByRole('button', { name: 'ECA' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Digital Post/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Modeler' })).toBeVisible()
  })

  test('step 1 has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.waitForSelector('button:has-text("Log ind som")', { timeout: 15000 })
    await scan(page)
  })

  test('mobile step indicator shows "Trin 1 af 5"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const button = page.locator('button.step-indicator-button')
    await expect(button).toBeVisible()
    await expect(button).toContainText(/Trin\s*1\s*af 5/)
  })

  test('MitID button kicks off the MitID redirect (no follow)', async ({ page }) => {
    const navigationPromise = page.waitForRequest(
      (req) => req.url().includes('/mitid/login') && req.method() === 'GET',
      { timeout: 5000 },
    ).catch(() => null)

    await page.getByRole('button', { name: 'Log ind som Freja Nielsen' }).click()

    const req = await navigationPromise
    expect(req, 'expected a request to /mitid/login').not.toBeNull()
    expect(req!.url()).toContain('/mitid/login')
    // One click: the persona's username travels as a login_hint suggestion.
    expect(req!.url()).toContain('login_hint=freja.nielsen')
    expect(req!.url()).toContain('fresh=1')
  })
})

test.describe('Byggetilladelse demo - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')

  test('completes the full flow as freja.nielsen', async ({ page }) => {
    await page.goto('/demo/byggetilladelse', { waitUntil: 'networkidle' })
    await expect(page.locator('h1')).toHaveText('Byggetilladelse')

    // Step 1 -> themed Keycloak login.
    await page.getByRole('button', { name: 'Log ind som Freja Nielsen' }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    // login_hint prefills the username; only the password is typed.
    await expect(page.locator('#kc-hinted-username')).toHaveText('freja.nielsen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')

    // Back on the wizard at step 2: the provenance table.
    await page.waitForURL(/\/demo\/byggetilladelse/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    const table = page.locator('table.demo-provenance__table')
    await expect(table).toBeVisible({ timeout: 15000 })
    await expect(table.locator('tr[data-prefill-key="applicant_name"]')).toContainText('Freja Nielsen')
    // The CPR arrives masked from the backend and is shown as delivered.
    await expect(table.locator('tr[data-prefill-key="cpr"]')).toContainText(/\d{6}-XXXX/)
    await expect(table.locator('tr[data-prefill-key="cpr"] .badge')).toHaveText('LIVE-PARAT')
    await expect(table.locator('tr[data-prefill-key="cpr"]')).toContainText(/audit #\d+/)
    // The address rail is the mock IdP: honest DEMO badge.
    await expect(table.locator('tr[data-prefill-key="property_address"] .badge')).toHaveText('DEMO')
    await expect(page.getByText('Beskrivelse af projektet')).toBeVisible()
    await scan(page)

    // Step 3: the only typed field.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await expect(page.locator('ol.step-indicator li.current .step-title').first()).toHaveText('Det kun du ved')

    // Validation goes to the DKFDS error summary.
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()
    await expect(page.locator('[data-module="error-summary"]')).toBeVisible()
    await expect(page.locator('[data-module="error-summary"] a')).toHaveCount(1)
    await scan(page)

    await page.locator('textarea').fill('Tilbygning på 30 m² mod nordfacaden, etage 1.')
    await page.getByRole('button', { name: /Indsend ansøgning/i }).click()

    // Step 4: workflow steps reveal, then step 5 with the letter.
    await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#demo-step-letter')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Modtaget: ansøgning om byggetilladelse/i).first()).toBeVisible({ timeout: 20000 })
    await expect(page.getByRole('button', { name: 'Kør igen' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('ol.step-indicator li.current .step-title').first()).toHaveText('Digital Post')
    await scan(page)
  })
})
