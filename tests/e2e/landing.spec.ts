import { test, expect } from '@playwright/test'

// Landing page on DKFDS (issue #19). One shared page load for the whole
// describe block; the browser locale is Danish so `/` is not redirected to
// /en by detectBrowserLanguage.
test.use({ locale: 'da-DK' })

test.describe('Landing Page', () => {
  test.describe.configure({ mode: 'serial' })

  let sharedPage: any

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ locale: 'da-DK' })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('main#main h1', { timeout: 15000 })
  })

  test.afterAll(async () => {
    await sharedPage?.context().close()
  })

  test('renders hero section with ÅbenForms heading', async () => {
    await expect(sharedPage.locator('h1')).toContainText('Åben')
    await expect(sharedPage.locator('h1')).toContainText('Forms')
  })

  test('shows the tagline and the open source badge', async () => {
    await expect(sharedPage.getByText(/fra MitID-login til afgørelsen i Digital Post/)).toBeVisible()
    await expect(sharedPage.locator('a.badge', { hasText: 'Åben kildekode, GPL-2.0' })).toBeVisible()
  })

  test('hero actions are DKFDS buttons', async () => {
    const hero = sharedPage.locator('.landing-hero')
    await expect(hero.locator('a.button.button-primary')).toHaveCount(1)
    await expect(hero.getByRole('link', { name: 'Alle demoer' })).toHaveAttribute('href', '/demo')
  })

  test('demo section uses the agreed copy', async () => {
    const demo = sharedPage.locator('#demo')
    await demo.scrollIntoViewIfNeeded()
    await expect(demo.getByRole('heading', { level: 2 })).toHaveText('MitID ind, afgørelse ud')
    await expect(demo.getByText('ECA-flowet kører synkront og returnerer hvert trin')).toBeVisible()
    await expect(demo.getByText('Afgørelsen hentes ud af Digital Post-loggen efter afsendelse')).toBeVisible()
    await expect(demo.getByRole('link', { name: /Læs den tekniske gennemgang/ }))
      .toHaveAttribute('href', 'https://github.com/madsnorgaard/AabenForms/blob/main/docs/DATA-FLOW.md')
  })

  test('demo preview card links to the byggetilladelse demo', async () => {
    // Requires NUXT_PUBLIC_DEMO_BYGGETILLADELSE_ENABLED=true at build time
    // (the DDEV config sets it); otherwise the card links to /kontakt.
    const card = sharedPage.locator('#demo a.card')
    await expect(card).toHaveAttribute('href', '/demo/byggetilladelse')
    await expect(card.getByRole('heading', { name: 'Åbn den interaktive demo' })).toBeVisible()
  })

  test('comparison is a DKFDS table with row headers', async () => {
    const table = sharedPage.locator('table.table')
    await expect(table.locator('thead th')).toHaveCount(3)
    await expect(table.locator('tbody th[scope="row"]')).toHaveCount(5)
    await expect(table.getByText('Prismodel')).toBeVisible()
  })

  test('renders the capability cards', async () => {
    await expect(sharedPage.getByRole('heading', { name: 'Færdige forløb at bygge videre på' })).toBeVisible()
    await expect(sharedPage.getByRole('heading', { name: 'MitID og NemLog-in via OIDC' })).toBeVisible()
    await expect(sharedPage.getByRole('heading', { name: 'Beskyttelse af CPR' })).toBeVisible()
  })

  test('renders workflow timeline with 4 steps', async () => {
    const steps = sharedPage.locator('ol.landing-timeline > li')
    await expect(steps).toHaveCount(4)
    await expect(steps.nth(0)).toContainText('Borger')
    await expect(steps.nth(1)).toContainText('Sagsbehandler')
    await expect(steps.nth(2)).toContainText('Teknisk sagkyndig')
    await expect(steps.nth(3)).toContainText('Afgørelse')
  })

  test('copy stays honest and free of retired phrases', async () => {
    const body = (await sharedPage.textContent('body')) || ''
    for (const retired of [
      'Vi spiser MitID',
      'returnerer alle steps',
      'Brev hentes',
      'gratis i 30 dage',
      'Indbygget GDPR',
      'real-time',
      'Live demo',
    ]) {
      expect(body, retired).not.toContain(retired)
    }
    // Plain hyphens only.
    expect(body).not.toMatch(/[–—]/)
  })

  test('no decorative motion or glass effects remain', async () => {
    const count = await sharedPage.locator('.animate-pulse, .animate-spin, [class*="backdrop-blur"], [class*="tracking-widest"], [class*="bg-gradient"]').count()
    expect(count).toBe(0)
  })

  test('renders footer with license', async () => {
    const footer = sharedPage.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('text=GPL')).toBeVisible()
  })

  test('has no broken i18n keys', async () => {
    const bodyText = (await sharedPage.textContent('body')) || ''
    expect(bodyText).not.toMatch(/\b(landingCta|workflowDemo|comparison|features|hero)\.[a-zA-Z]/)
  })

  test('ECA section mentions the modeler and JSON:API', async () => {
    await expect(sharedPage.getByText('Visuel modeler, hvor forløbet kan læses og ændres')).toBeVisible()
    await expect(sharedPage.locator('text=/JSON:API/').first()).toBeVisible()
  })

  test('the demo request modal opens, traps focus and closes on Escape', async () => {
    // The fixed cookie banner would cover the footer CTA band.
    const reject = sharedPage.getByRole('button', { name: 'Nej tak til cookies' })
    if (await reject.isVisible().catch(() => false)) await reject.click()
    const opener = sharedPage.getByRole('button', { name: 'Book en demo' })
    await opener.click()
    const dialog = sharedPage.getByRole('dialog', { name: 'Book en demo' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Luk' })).toBeFocused()
    await sharedPage.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })
})
