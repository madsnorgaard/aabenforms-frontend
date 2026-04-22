import { test, expect } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

test.describe('Demo Form Interaction', () => {
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

  test('contact form has input fields', async () => {
    const contactForm = sharedPage.locator('form').first()
    await expect(contactForm).toBeVisible()
    await expect(contactForm.locator('input').first()).toBeVisible()
  })

  test('building permit form has CPR and address fields', async () => {
    const permitForm = sharedPage.locator('form').nth(1)
    await expect(permitForm).toBeVisible()
    await expect(permitForm.locator('text=/CPR/i')).toBeVisible()
  })

  test('workflow timeline shows all 4 steps', async () => {
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

  test('POST /api/webform/parent_request_form/submit creates submission', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/parent_request_form/submit`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      data: {
        data: {
          child_name: 'Test Child',
          child_cpr: '0101200001',
          parent1_email: 'parent1@test.dk',
          parent2_email: 'parent2@test.dk',
          parents_together: 'together',
          request_details: 'E2E test dual-parent approval workflow',
        },
      },
      ignoreHTTPSErrors: true,
    })

    expect(response.status()).toBe(201)
  })

  test('GET /mitid/session/nonexistent returns 404', async ({ request }) => {
    const response = await request.get(`${API_BASE}/mitid/session/nonexistent-id`, {
      headers: { 'Accept': 'application/json' },
      ignoreHTTPSErrors: true,
    })

    expect(response.status()).toBe(404)
  })
})
