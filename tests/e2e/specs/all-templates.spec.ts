/**
 * @file
 * Per-BPMN-template API submission specs.
 *
 * Iterates the templateFixtures map and runs the same shape of test
 * for each of the 13 workflow templates so a regression in any one
 * surfaces with a clear template-named failure rather than a generic
 * "the API is broken". Tests run in parallel via Playwright workers.
 *
 * The HR-bundle templates (hr_onboarding, mileage_expense,
 * phone_declaration) require the aabenforms_employee role since
 * Phase B item 1 — anonymous POSTs are asserted to 403, the authed
 * happy-path is deferred to a follow-up MitID-driven spec.
 */

import { test, expect } from '@playwright/test'
import { templateFixtures } from '../../fixtures/template-fixtures'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

for (const [name, fixture] of Object.entries(templateFixtures)) {
  test.describe(`template: ${name}`, () => {
    if (fixture.requiresEmployeeRole) {
      test('anonymous POST is rejected with 403', async ({ request }) => {
        const response = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(response.status()).toBe(403)
      })

      test.skip('authenticated employee POST → 201 (MitID flow)', () => {
        // Deferred: requires the MitID-driven Playwright fixture to
        // log in as a user with the aabenforms_employee role.
      })
    }
    else {
      test('POST with valid data → 201 + workflow.steps', async ({ request }) => {
        const response = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(
          response.status(),
          `Expected 201 for ${name}; got ${response.status()}`,
        ).toBe(201)

        const body = await response.json()
        expect(body.data, 'response.data missing').toBeTruthy()
        expect(body.data.id, 'submission id missing').toBeTruthy()

        // workflow.steps comes back when ECA executes during the
        // submission insert; assert at least the expected count, not
        // exact, so optional steps don't break the spec.
        const steps = body.workflow?.steps ?? []
        expect(
          Array.isArray(steps),
          'workflow.steps not an array',
        ).toBeTruthy()
        expect(
          steps.length,
          `expected at least ${fixture.expectedSteps} steps for ${name}; got ${steps.length}`,
        ).toBeGreaterThanOrEqual(fixture.expectedSteps)
      })
    }
  })
}
