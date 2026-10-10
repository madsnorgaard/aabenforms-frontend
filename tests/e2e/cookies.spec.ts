import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// DKFDS cookiemeddelelse + af_consent cookie (issue #65).
//
// Every test gets a fresh browser context: the whole point is the cookie
// state, so nothing may leak between tests. Page loads are kept to one per
// test (two for the reload case).

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const ALLOWED_BEFORE_CHOICE = ['i18n_redirected']
const DAY = 24 * 60 * 60

function formatViolations(violations: any[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  ')}`)
    .join('\n\n')
}

async function scan(page: Page) {
  // The landing hero fades in (reveal-up); axe would measure the buttons
  // mid-fade as low contrast, so let running animations finish first.
  await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, { timeout: 5000 }).catch(() => {})
  return new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze()
}

// Vue sets `__vue_app__` on the mount container once hydration has run; the
// banner is client-rendered right after that, so this is the signal to wait
// for before asserting that it is (or is not) there.
async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => Boolean((document.getElementById('__nuxt') as any)?.__vue_app__),
    null,
    { timeout: 15000 },
  )
}

async function openLanding(page: Page) {
  await page.goto('/', { waitUntil: 'commit', timeout: 20000 })
  await page.waitForSelector('h1', { timeout: 15000 })
  await waitForHydration(page)
}

async function cookieNames(context: BrowserContext) {
  return (await context.cookies()).map((c) => c.name).sort()
}

async function documentCookieNames(page: Page) {
  return page.evaluate(() =>
    document.cookie
      .split('; ')
      .filter(Boolean)
      .map((pair) => pair.split('=')[0])
      .sort(),
  )
}

test.describe('Cookie banner (DKFDS cookiemeddelelse)', () => {
  // A Danish browser stays on `/` (the i18n root redirect would otherwise send
  // an en-US Playwright browser to /en) so the Danish strings can be asserted.
  test.use({ locale: 'da-DK' })

  test('first visit shows the banner before the header, with no non-essential cookie', async ({ page, context }) => {
    await openLanding(page)

    const banner = page.locator('.cookie-container')
    await expect(banner).toBeVisible()
    await expect(banner).toHaveAttribute('role', 'complementary')
    await expect(banner).toHaveAttribute('aria-labelledby', 'cookie-message-heading')
    await expect(banner).toHaveAttribute('aria-describedby', 'cookie-message-text')
    await expect(banner.locator('h2#cookie-message-heading')).toHaveText('Fortæl os om du accepterer cookies')
    await expect(banner.locator('p#cookie-message-text a')).toHaveAttribute('href', '/cookies')
    await expect(banner.locator('ul.inline-list button.button.button-secondary')).toHaveCount(2)
    await expect(banner.getByRole('button', { name: 'Accepter cookies' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Nej tak til cookies' })).toBeVisible()

    // DKFDS placement: the banner precedes the header in document order.
    const precedesHeader = await page.evaluate(() => {
      const banner = document.querySelector('.cookie-container')
      const header = document.querySelector('header')
      return !!banner && !!header && Boolean(banner.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(precedesHeader).toBe(true)

    // Not a modal: focus is left where the browser put it.
    const activeTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeTag).toBe('BODY')

    // Nothing non-essential before a choice. Both the jar and document.cookie
    // only ever hold the language cookie at this point.
    const jar = await cookieNames(context)
    expect(jar.filter((name) => !ALLOWED_BEFORE_CHOICE.includes(name))).toEqual([])
    expect(jar).not.toContain('af_consent')
    const visible = await documentCookieNames(page)
    expect(visible.filter((name) => !ALLOWED_BEFORE_CHOICE.includes(name))).toEqual([])

    // The banner itself must be AA clean while shown.
    const { violations } = await scan(page)
    expect(violations, formatViolations(violations)).toEqual([])
  })

  test('"Accepter cookies" hides the banner and stores af_consent=accepted', async ({ page, context }) => {
    await openLanding(page)
    await page.locator('.cookie-container').getByRole('button', { name: 'Accepter cookies' }).click()

    await expect(page.locator('.cookie-container')).toHaveCount(0)

    const consent = (await context.cookies()).find((c) => c.name === 'af_consent')
    expect(consent).toBeDefined()
    expect(consent!.value).toBe('accepted')
    expect(consent!.sameSite).toBe('Lax')
    expect(consent!.secure).toBe(true)
    expect(consent!.path).toBe('/')
    const lifetimeDays = (consent!.expires - Date.now() / 1000) / DAY
    expect(lifetimeDays).toBeGreaterThan(364)
    expect(lifetimeDays).toBeLessThan(366)

    const visible = await documentCookieNames(page)
    expect(visible).toContain('af_consent')
    expect(visible.filter((name) => ![...ALLOWED_BEFORE_CHOICE, 'af_consent'].includes(name))).toEqual([])
  })

  test('"Nej tak til cookies" hides the banner and stores af_consent=rejected', async ({ page, context }) => {
    await openLanding(page)
    await page.locator('.cookie-container').getByRole('button', { name: 'Nej tak til cookies' }).click()

    await expect(page.locator('.cookie-container')).toHaveCount(0)
    const consent = (await context.cookies()).find((c) => c.name === 'af_consent')
    expect(consent?.value).toBe('rejected')
  })

  test('a stored choice means no banner on the next visit', async ({ page, context }) => {
    await openLanding(page)
    await page.locator('.cookie-container').getByRole('button', { name: 'Accepter cookies' }).click()
    await expect(page.locator('.cookie-container')).toHaveCount(0)

    await openLanding(page)
    // Give any client-side render a moment: the banner must never appear.
    await page.waitForTimeout(500)
    await expect(page.locator('.cookie-container')).toHaveCount(0)
    expect(await cookieNames(context)).toContain('af_consent')
  })

  test('/cookies explains the cookies, is AA clean, and "Ændr dit valg" brings the banner back', async ({ page, context }) => {
    await page.goto('/cookies', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForSelector('main#main h1', { timeout: 15000 })
    await waitForHydration(page)
    await expect(page.locator('main#main h1')).toHaveText('Cookies på ÅbenForms')
    await expect(page.locator('main#main table')).toContainText('i18n_redirected')
    await expect(page.locator('main#main table')).toContainText('af_consent')

    // First visit: the banner shows here too, and the policy's own button is
    // disabled until there is a choice to change.
    const banner = page.locator('.cookie-container')
    await expect(banner).toBeVisible()
    const change = page.getByRole('button', { name: 'Ændr dit valg' })
    await expect(change).toBeDisabled()

    const withBanner = await scan(page)
    expect(withBanner.violations, formatViolations(withBanner.violations)).toEqual([])

    await banner.getByRole('button', { name: 'Nej tak til cookies' }).click()
    await expect(banner).toHaveCount(0)
    await expect(page.locator('main#main')).toContainText('Du har sagt nej tak til cookies.')
    await expect(change).toBeEnabled()

    const afterChoice = await scan(page)
    expect(afterChoice.violations, formatViolations(afterChoice.violations)).toEqual([])

    await change.click()
    await expect(banner).toBeVisible()
    await expect(page.locator('main#main [role="status"]')).toContainText('Dit valg er nulstillet')
    expect(await cookieNames(context)).not.toContain('af_consent')
  })
})
