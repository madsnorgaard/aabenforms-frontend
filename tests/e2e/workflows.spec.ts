import { test, expect } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

test.describe('Landing demo CTA', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: any

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    await sharedPage.waitForSelector('#demo', { timeout: 15000 })
    await sharedPage.locator('#demo').scrollIntoViewIfNeeded()
  })

  test.afterAll(async () => {
    await sharedPage?.context().close()
  })

  test('landing #demo slot points at the dedicated /demo/byggetilladelse page', async () => {
    // The landing slot is now a CTA card - the interactive contact form
    // moved to /kontakt and the four-phase Byggetilladelse demo lives at
    // /demo/byggetilladelse. See tests/e2e/byggetilladelse-demo.spec.ts
    // for the full-flow coverage.
    const ctaLink = sharedPage.locator('a[href="/demo/byggetilladelse"]').first()
    await expect(ctaLink).toBeVisible()
  })

  test('workflow timeline section still shows ECA + Case Worker context', async () => {
    await expect(sharedPage.locator('text=/Case Worker|Sagsbehandler/i').first()).toBeVisible()
    await expect(sharedPage.locator('text=/ECA/i').first()).toBeVisible()
  })
})

test.describe('Backend API', () => {
  test('POST /api/webform/contact/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/contact/submit`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data: {
        data: {
          name: 'Playwright Test',
          email: 'playwright@test.dk',
          message: 'Automated E2E test submission',
        },
      },
      ignoreHTTPSErrors: true,
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('GET /api/mitid/session needs a Bearer session, never a URL id', async ({ request }) => {
    const unknown = await request.get(`${API_BASE}/api/mitid/session`, {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer wf_00000000000000000000000000000000' },
      ignoreHTTPSErrors: true,
    })
    expect(unknown.status()).toBe(401)
    // The old id-in-path route is gone.
    const legacy = await request.get(`${API_BASE}/mitid/session/wf_00000000000000000000000000000000`, { ignoreHTTPSErrors: true })
    expect(legacy.status()).toBe(404)
  })
})

// Staff and MitID-gated forms must never accept an anonymous submission:
// the webform's own access check refuses it before any flow runs.
const PROTECTED_FORMS = [
  'parent_request_form',
  'hr_onboarding',
  'mileage_expense',
  'phone_declaration',
  'citizen_service_application',
  'association_booking',
  'med_election_nomination',
]

test.describe('Protected forms refuse anonymous submissions', () => {
  for (const form of PROTECTED_FORMS) {
    test(`POST /api/webform/${form}/submit without login is refused`, async ({ request }) => {
      const response = await request.post(`${API_BASE}/api/webform/${form}/submit`, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        data: { data: { note: 'anonymous e2e probe' } },
        ignoreHTTPSErrors: true,
      })
      expect([401, 403]).toContain(response.status())
      const body = await response.json()
      expect(body.data?.id).toBeUndefined()
    })
  }
})
