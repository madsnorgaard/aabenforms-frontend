import { test, expect } from '@playwright/test'

// Share a single page load across all tests in this describe block.
// The Nuxt SSR dev server can't handle rapid sequential full page renders.
test.describe('Landing Page', () => {
  test.describe.configure({ mode: 'serial' })

  let sharedPage: any

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // AuthLoginButton sits inside <ClientOnly> - wait for client hydration.
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
  })

  test.afterAll(async () => {
    await sharedPage?.context().close()
  })

  test('renders hero section with ÅbenForms heading', async () => {
    await expect(sharedPage.locator('h1')).toContainText('Åben')
    await expect(sharedPage.locator('h1')).toContainText('Forms')
  })

  test('shows tagline text', async () => {
    const tagline = sharedPage.locator('text=/workflow/i')
    await expect(tagline.first()).toBeVisible()
  })

  test('displays Try Demo button', async () => {
    const demoButton = sharedPage.getByRole('button', { name: /demo/i })
    await expect(demoButton.first()).toBeVisible()
  })

  test('displays MitID login button', async () => {
    const loginButton = sharedPage.getByRole('button', { name: /MitID/i })
    await expect(loginButton).toBeVisible()
  })

  test('renders capabilities grid', async () => {
    await expect(sharedPage.getByRole('heading', { name: 'ECA Workflows' })).toBeVisible()
    await expect(sharedPage.getByRole('heading', { name: /MitID/ })).toBeVisible()
    await expect(sharedPage.getByRole('heading', { name: /GDPR/ })).toBeVisible()
  })

  test('renders workflow timeline with 4 steps', async () => {
    await expect(sharedPage.locator('text=/Citizen|Borger/i').first()).toBeVisible()
    await expect(sharedPage.locator('text=/Case Worker|Sagsbehandler/i').first()).toBeVisible()
    await expect(sharedPage.locator('text=/Technical|Teknisk/i').first()).toBeVisible()
    await expect(sharedPage.locator('text=/Approval|Godkendelse/i').first()).toBeVisible()
  })

  test('renders interactive-demo CTA section', async () => {
    await sharedPage.locator('#demo').scrollIntoViewIfNeeded()
    // Landing slot is now a single CTA pointing at /demo/byggetilladelse - the
    // contact form lives at /kontakt and the four-phase Byggetilladelse demo
    // runs on the dedicated /demo/byggetilladelse page.
    const ctaLink = sharedPage.locator('a[href="/demo/byggetilladelse"]').first()
    await expect(ctaLink).toBeVisible()
    await expect(sharedPage.locator('text=/Live demo/i').first()).toBeVisible()
  })

  test('CTA has POC-appropriate language', async () => {
    const pageContent = await sharedPage.textContent('body')
    expect(pageContent).not.toContain('free for 30 days')
    expect(pageContent).not.toContain('gratis i 30 dage')
  })

  test('renders footer with license', async () => {
    const footer = sharedPage.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('text=GPL')).toBeVisible()
  })

  test('has no broken i18n keys', async () => {
    const bodyText = await sharedPage.textContent('body') || ''
    expect(bodyText).not.toContain('workflow.title')
    expect(bodyText).not.toContain('workflow.steps')
    expect(bodyText).not.toContain('workflow.eca')
  })

  test('ECA section shows BPMN and JSON:API', async () => {
    await expect(sharedPage.locator('text=/BPMN/i').first()).toBeVisible()
    await expect(sharedPage.locator('text=/JSON:API/i').first()).toBeVisible()
  })
})
