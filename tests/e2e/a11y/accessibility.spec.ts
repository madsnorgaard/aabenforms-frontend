import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Automated WCAG 2.0/2.1 A + AA scan of the live flows. This is the regression
// net that replaces the previously-untested "AA compliant" claim: a real axe
// run on every key surface, asserting zero violations.
//
// One shared context, serial, few full renders: the Nuxt SSR dev server crashes
// after ~7 rapid full page renders, so every spec in this repo reuses a single
// page. We keep to a handful of routes for the same reason.

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function scan(page: any) {
  return new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
}

// Renders a compact, readable failure so a violation report names the rule +
// the offending nodes rather than dumping the whole axe object.
function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test.describe.configure({ mode: 'serial' })

  let page: any

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.afterAll(async () => {
    await page?.context().close()
  })

  test('landing page has no AA violations', async () => {
    await page.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForSelector('h1', { timeout: 15000 })
    const { violations } = await scan(page)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('contact form has no AA violations', async () => {
    await page.goto('/kontakt', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForSelector('main#main h1, main#main input', { timeout: 15000 })
    const { violations } = await scan(page)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('address combobox harness has no AA violations', async () => {
    await page.goto('/av-test', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForSelector('input[role="combobox"]', { timeout: 15000 })
    const { violations } = await scan(page)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('MitID-gated form (gate state) has no AA violations', async () => {
    await page.goto('/forms/merudgifter', { waitUntil: 'commit', timeout: 20000 })
    // Either the gate or the form renders; wait for the main landmark content.
    await page.waitForSelector('main#main', { timeout: 15000 })
    await page.waitForTimeout(1500)
    const { violations } = await scan(page)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('address combobox is keyboard operable', async () => {
    await page.goto('/av-test', { waitUntil: 'commit', timeout: 20000 })
    const combo = page.locator('input[role="combobox"]')
    await combo.waitFor({ timeout: 15000 })
    await combo.focus()
    await expect(combo).toBeFocused()
    // The label is programmatically associated (our fix): the accessible name
    // is non-empty, so a screen reader announces the field.
    const ariaExpandedBefore = await combo.getAttribute('aria-expanded')
    expect(ariaExpandedBefore).toBe('false')
    await combo.type('Rentemester', { delay: 20 })
    // Give the debounced DAWA search time to open the listbox.
    await page.waitForTimeout(1200)
    await combo.press('ArrowDown')
    await combo.press('Escape')
    await expect(combo).toHaveAttribute('aria-expanded', 'false')
  })
})
