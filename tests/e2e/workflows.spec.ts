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

test.describe('OS2Forms stub workflows', () => {
  test('POST /api/webform/hr_onboarding/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/hr_onboarding/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          new_hire_name: 'Playwright New Hire',
          new_hire_email: 'hire@test.dk',
          start_date: '2026-05-01',
          department: 'Digitalisering',
          job_title: 'Developer',
          manager_email: 'manager@test.dk',
          it_distribution_email: 'it@test.dk',
          equipment_needs: 'MacBook, iPhone, access to GitLab',
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('POST /api/webform/mileage_expense/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/mileage_expense/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          employee_name: 'Playwright Employee',
          employee_id: 'E12345',
          claim_type: 'mileage',
          claim_date: '2026-04-20',
          amount: 250,
          kilometres: 45,
          purpose: 'Client visit',
          manager_email: 'manager@test.dk',
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('POST /api/webform/phone_declaration/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/phone_declaration/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          employee_name: 'Playwright Employee',
          employee_id: 'E12345',
          tax_year: '2026',
          phone_number: '12345678',
          private_use_declared: 'yes',
          manager_email: 'manager@test.dk',
          declaration_date: '2026-04-23',
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('POST /api/webform/citizen_service_application/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/citizen_service_application/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          applicant_name: 'Freja Nielsen',
          applicant_cpr: '0101904521',
          applicant_email: 'citizen@test.dk',
          service_type: 'housing_benefit',
          application_details: 'Applying for housing benefit due to income change.',
          supporting_info: 'Documentation attached separately in production.',
          caseworker_email: 'caseworker@test.dk',
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('POST /api/webform/association_booking/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/association_booking/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          association_name: 'Test Forening',
          cvr: '12345678',
          contact_name: 'Karen Christensen',
          contact_email: 'association@test.dk',
          contact_phone: '87654321',
          request_type: 'booking',
          facility_or_purpose: 'Community hall for annual meeting',
          requested_date: '2026-06-15',
          amount: 500,
          reviewer_email: 'reviewer@test.dk',
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })

  test('POST /api/webform/med_election_nomination/submit accepts data', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/webform/med_election_nomination/submit`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      data: {
        data: {
          election_id: 'MED-2026-Q2',
          nomination_type: 'self',
          nominator_name: 'Sofie Hansen',
          nominator_cpr: '2506924015',
          nominee_name: 'Sofie Hansen',
          nominee_department: 'IT',
          statement: 'Candidate statement for MED committee',
          consent: true,
        },
      },
      ignoreHTTPSErrors: true,
    })
    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.data).toHaveProperty('id')
  })
})
