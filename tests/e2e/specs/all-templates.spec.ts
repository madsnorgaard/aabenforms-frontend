/**
 * @file
 * Per-BPMN-template API submission specs.
 *
 * Iterates the templateFixtures map and runs the same shape of test for each
 * workflow template, so a regression in any one surfaces with a clear
 * template-named failure rather than a generic "the API is broken".
 *
 * Three access classes, each asserted the way the platform now enforces it:
 *  - Open forms (contact, foi_request): an anonymous POST is accepted (201)
 *    and the flow's workflow.steps come back.
 *  - MitID-gated forms: an anonymous POST is refused with 401 before any flow
 *    runs (PR #257), the schema advertises requires_mitid so the SPA shows its
 *    gate, and with a MitID session (workflow_id in the body, as the SPA sends
 *    it) the submission is accepted and the flow runs, starting with the MitID
 *    validation step. The happy path seeds the session with drush
 *    (aabenforms:seed-mitid-session, DDEV only), so it runs only with
 *    E2E_FULL_AUTH=1.
 *  - Staff forms (requiresEmployeeRole): an anonymous POST gets 403 from the
 *    webform access check. The authenticated-employee happy path needs a staff
 *    login fixture and is still deferred.
 */

import { execSync } from 'node:child_process'
import { test, expect } from '@playwright/test'
import { templateFixtures } from '../../fixtures/template-fixtures'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'
const BACKEND_DIR = process.env.BACKEND_DIR || '../backend'
const FULL_AUTH = process.env.E2E_FULL_AUTH === '1'

/**
 * Forms whose flow validates MitID. Kept as an explicit list (not read from
 * the schema's requires_mitid flag) so that dropping the server-side gate on
 * any of them fails this spec instead of silently turning it into an open form.
 */
const MITID_GATED = new Set([
  'address_change',
  'association_booking',
  'building_permit',
  'citizen_service_application',
  'company_verification',
  'marriage_booking',
  'med_election_nomination',
  'parking_permit',
])

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

/** Seeds a MitID session for a mock persona (DDEV only) and returns its workflow id. */
function seedMitIdSession(persona: string): string {
  const out = execSync(`ddev drush aabenforms:seed-mitid-session ${persona} 2>&1`, { cwd: BACKEND_DIR }).toString()
  const sid = /Workflow id:\s*(\S+)/.exec(out)?.[1]
  if (!sid) throw new Error(`could not seed a MitID session for ${persona}: ${out}`)
  return sid
}

function assertSteps(body: any, name: string, expectedSteps: number) {
  expect(body.data, 'response.data missing').toBeTruthy()
  expect(body.data.id, 'submission id missing').toBeTruthy()
  // workflow.steps comes back when ECA executes during the submission insert;
  // assert at least the expected count, not exact, so optional steps don't
  // break the spec.
  const steps = body.workflow?.steps ?? []
  expect(Array.isArray(steps), 'workflow.steps not an array').toBeTruthy()
  expect(
    steps.length,
    `expected at least ${expectedSteps} steps for ${name}; got ${steps.length}`,
  ).toBeGreaterThanOrEqual(expectedSteps)
  return steps as Array<{ id: string, status: string }>
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
        expect((await response.json()).data?.id).toBeUndefined()
      })

      test.skip('authenticated employee POST -> 201', () => {
        // Deferred until staff log in with the kommune's own identity (backend #260).
      })
    }
    else if (MITID_GATED.has(fixture.webformId)) {
      test('anonymous POST is refused with 401 and the schema advertises the gate', async ({ request }) => {
        const response = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(response.status(), `anonymous ${name}`).toBe(401)
        expect((await response.json()).data?.id).toBeUndefined()

        // A made-up workflow id is no better than none.
        const forged = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { workflow_id: 'wf_00000000000000000000000000000000', data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(forged.status(), `forged workflow_id on ${name}`).toBe(401)

        const schema = await request.get(`${API_BASE}/api/webform/${fixture.webformId}`, { headers, ignoreHTTPSErrors: true })
        expect(schema.ok()).toBeTruthy()
        expect(JSON.stringify(await schema.json())).toContain('"requires_mitid":true')
      })

      test('POST with a MitID session -> 201 + workflow.steps', async ({ request }) => {
        test.skip(!FULL_AUTH, 'set E2E_FULL_AUTH=1 to run; seeds a MitID session with drush (DDEV only)')
        const workflowId = seedMitIdSession('freja')
        const response = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { workflow_id: workflowId, data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(response.status(), `Expected 201 for ${name}; got ${response.status()}`).toBe(201)
        const steps = assertSteps(await response.json(), name, fixture.expectedSteps)
        const mitid = steps.find(s => s.id === 'aabenforms_mitid_validate')
        expect(mitid?.status, `MitID validation step for ${name}: ${JSON.stringify(steps)}`).toBe('completed')
      })
    }
    else {
      test('anonymous POST with valid data -> 201 + workflow.steps', async ({ request }) => {
        const response = await request.post(
          `${API_BASE}/api/webform/${fixture.webformId}/submit`,
          { headers, data: { data: fixture.data }, ignoreHTTPSErrors: true },
        )
        expect(response.status(), `Expected 201 for ${name}; got ${response.status()}`).toBe(201)
        assertSteps(await response.json(), name, fixture.expectedSteps)
      })
    }
  })
}
