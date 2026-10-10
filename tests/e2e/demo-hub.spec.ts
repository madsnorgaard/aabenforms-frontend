import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * /demo hub: one DKFDS card per guided scenario, every card links to its
 * wizard, and the page is WCAG 2.1 AA clean (axe).
 *
 * Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time
 * (the DDEV config sets it); without it the available card has no link.
 */

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

test.describe('Demo hub', () => {
  test.describe.configure({ mode: 'serial' })

  let page: any

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
    await page.goto('/demo', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForSelector('main#main h1', { timeout: 15000 })
  })

  test.afterAll(async () => {
    await page?.context().close()
  })

  test('renders the heading, the framing and the demo authority in the header', async () => {
    await expect(page.locator('h1')).toHaveText('Prøv ÅbenForms')
    await expect(page.getByText('Vi spørger ikke om det, vi allerede ved.')).toBeVisible()
    await expect(page.locator('header .authority-name').first()).toHaveText('Demo-kommune')
  })

  test('renders one DKFDS card per scenario with lists and difficulty', async () => {
    const cards = page.locator('.card-row .card')
    await expect(cards).toHaveCount(4)

    const bygge = page.locator('[data-scenario="byggetilladelse"] .card')
    await expect(bygge.locator('.card-heading')).toHaveText('Byggetilladelse')
    await expect(bygge.getByText('Hentes automatisk:')).toBeVisible()
    await expect(bygge.getByText('Du skriver selv:')).toBeVisible()
    await expect(bygge.locator('.badge', { hasText: 'Simpel' })).toBeVisible()
    await expect(bygge.getByText('Du er Freja Nielsen')).toBeVisible()

    // All four scenarios have shipped: each card links to its wizard.
    const titles: Record<string, string> = {
      byggetilladelse: 'Byggetilladelse',
      merudgifter: 'Merudgifter til et barn med handicap',
      skoleskift: 'Skoleskift med to forældre',
      klage: 'Klage over en afgørelse',
    }
    for (const [id, title] of Object.entries(titles)) {
      const card = page.locator(`[data-scenario="${id}"] .card`)
      await expect(card.locator('.card-heading')).toHaveText(title)
      await expect(card.locator('.badge', { hasText: 'Kommer' })).toHaveCount(0)
      await expect(card.locator('a.button')).toHaveAttribute('href', new RegExp(`/demo/${id}$`))
    }

    // Klage carries the "Digital inklusion" tag.
    await expect(page.locator('[data-scenario="klage"] .tag')).toHaveText('Digital inklusion')
  })

  test('has no WCAG 2.1 AA violations', async () => {
    const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('the byggetilladelse link opens the wizard with the step indicator', async () => {
    await page.locator('[data-scenario="byggetilladelse"] a.button').click()
    await page.waitForURL(/\/demo\/byggetilladelse$/, { timeout: 15000 })
    await expect(page.locator('h1')).toHaveText('Byggetilladelse')
    await expect(page.getByRole('navigation', { name: 'Trinindikator' })).toBeVisible()
    await expect(page.locator('ol.step-indicator li.current .step-title').first()).toHaveText('Log ind med MitID')
  })
})
