import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo/klage-fuldmagt: Mikkel appeals for his mother Birthe with a digital
 * fuldmagt (backend #241), and her receipt goes on paper (backend #242).
 *
 *  - Smoke: the hub card links to the wizard with Mikkel's login card.
 *  - Full (E2E_FULL_AUTH=1): resets Birthe's demo case, logs in as
 *    mikkel.jensen, sees Birthe's cases (acting for her), types the reason,
 *    and the flow registers the appeal in her name. Birthe's receipt is a
 *    physical letter; Mikkel gets the copy in his own Digital Post. The
 *    backend records Mikkel as actor with the basis "fuldmagt".
 */

const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const TITLE = 'Mikkel klager på vegne af sin mor'

async function scan(page: any) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
  expect(violations, violations.map((v: any) => `${v.id}: ${v.help}`).join('\n')).toEqual([])
}

test.describe('Klage med fuldmagt - smoke', () => {
  test('hub card links to the wizard', async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle', timeout: 20000 })
    const card = page.locator('[data-scenario="klage-fuldmagt"] .card')
    await expect(card.locator('.card-heading')).toHaveText(TITLE)
    await card.locator('a.button').click()
    await page.waitForURL(/\/demo\/klage-fuldmagt/)
    await expect(page.locator('h1')).toHaveText(TITLE)
    await expect(page.getByRole('button', { name: 'Log ind som Mikkel Jensen' })).toBeVisible()
    await expect(page.getByText(/logger aldrig ind som sin mor/)).toBeVisible()
  })
})

test.describe('Klage med fuldmagt - full auth', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(150000)

  test('mikkel appeals for birthe; receipt on paper to her, copy to him', async ({ page, context }) => {
    const seed = execSync('cd ../backend && ddev drush aabenforms:demo:seed-klage-case --reset 2>&1').toString()
    const caseId = seed.match(/(?:seeded (?:fresh )?case|merudgifter case:) #(\d+)/i)?.[1]
    expect(caseId, seed).toBeTruthy()

    await context.clearCookies()
    await page.setViewportSize({ width: 1400, height: 900 })
    await page.goto('/demo/klage-fuldmagt', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Log ind som Mikkel Jensen' }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    if (await page.locator('#username').isVisible()) await page.fill('#username', 'mikkel.jensen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage-fuldmagt/, { timeout: 20000 })

    // Step 2: acting for Birthe; her cases, never her full CPR.
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('demo-prefill-alert')).toContainText('Du handler på vegne af Birthe Jensen (240348-XXXX) med digital fuldmagt')
    const table = page.locator('table.demo-provenance__table')
    await expect(table.locator('tr[data-prefill-key="applicant_cpr"]')).toContainText('240348-XXXX')
    expect(await page.content()).not.toContain('2403482210')
    const values = await page.locator('.form-group-radio input[type="radio"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
    expect(values).toContain(String(caseId))
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/klage-fuldmagt-step2.png`, fullPage: true })

    // Step 3: only the reason.
    await page.getByRole('button', { name: 'Fortsæt' }).click()
    await page.locator('textarea').fill('Min mor har udgifter til medicin og transport på over 1.000 kr. om måneden. Afslaget bygger på et for lavt beløb.')
    await page.getByRole('button', { name: /Indsend/i }).click()

    // Steps 4 and 5: appeal registered in her name, copy in his inbox.
    await expect(page.getByRole('heading', { name: 'Sagsbehandling' })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.demo-wizard__step-error')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Klagen er registreret i Birthes navn' })).toBeVisible({ timeout: 45000 })
    const receipt = page.getByTestId('demo-receipt')
    await expect(receipt).toContainText('Mikkel Jensen med digital fuldmagt')
    await expect(receipt).toContainText('Sendt som fysisk brev')
    // This run's copy, among the new letters (earlier runs fold away).
    await expect(page.getByTestId('demo-inbox-current').locator('.demo-inbox__item', { hasText: 'Kopi: klage indgivet med digital fuldmagt' })).toHaveCount(1, { timeout: 30000 })
    await scan(page)
    if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/klage-fuldmagt-step5.png`, fullPage: true })

    // The backend: case appealed, Birthe the applicant, Mikkel the actor.
    const status = execSync(`cd ../backend && ddev drush php:eval "echo \\Drupal::entityTypeManager()->getStorage('aabenforms_case')->load(${caseId})->get('status')->value;" 2>/dev/null`).toString().trim()
    expect(status).toBe('paaklaget')
    const basis = execSync(`cd ../backend && ddev drush sqlq "SELECT d.value FROM webform_submission_data d JOIN webform_submission s ON s.sid=d.sid WHERE s.webform_id='klage' AND d.name='representation_basis' ORDER BY s.sid DESC LIMIT 1" 2>/dev/null`).toString().trim()
    expect(basis).toBe('fuldmagt')
  })
})

test.describe('Klage med fuldmagt - fails closed', () => {
  test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; requires host-network access to localhost:8080')
  test.setTimeout(90000)

  test('without a fuldmagt nothing can be chosen or submitted', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/demo/klage-fuldmagt', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Log ind som Mikkel Jensen' }).click()
    await page.waitForURL(/realms\/danish-gov-test\/protocol\/openid-connect\/auth/, { timeout: 15000 })
    // Freja holds no fuldmagt for anyone. The login hint pins Mikkel's
    // username, so restart the login to choose another person.
    if (!(await page.locator('#username').isVisible())) await page.getByRole('link', { name: /Start over|Start forfra/ }).click()
    await page.fill('#username', 'freja.nielsen')
    await page.fill('#password', 'test1234')
    await page.click('#kc-login')
    await page.waitForURL(/\/demo\/klage-fuldmagt/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Det spurgte vi ikke om' })).toBeVisible({ timeout: 15000 })
    // No cases offered (neither Birthe's nor Freja's own) and no way forward.
    await expect(page.locator('.form-group-radio input[type="radio"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Fortsæt' })).toBeDisabled()
  })
})

