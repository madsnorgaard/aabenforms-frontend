/**
 * @file
 * E2E coverage for the digital_post_send happy path against the
 * fake_db transport.
 *
 * Backstop for [`aabenforms`#21 / PR #26]: the SendDigitalPostAction
 * refactor + DigitalPostSenderInterface extraction. The unit tests
 * cover the action's three recipient-resolver strategies + failure
 * paths with mocks; this spec proves the action is wired up correctly
 * inside a real ECA flow with the real container, the fake_db
 * transport recording payloads, and the workflow.steps response
 * carrying the right outcome.
 *
 * Why citizen_service_application: it's the only ECA flow currently
 * shipping `aabenforms_digital_post_send` (verified via
 * `grep aabenforms_digital_post_send config/sync/eca.eca.*.yml`).
 *
 * Local DDEV needs `aabenforms_digital_post.settings:sender_cvr` set
 * to a non-empty value (e.g. `ddev drush config:set ... sender_cvr
 * 12345678 -y`). Production already has this configured.
 */

import { test, expect } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

test.describe('digital_post_send fake_db happy path', () => {
  test('citizen_service_application submission triggers a successful Digital Post send', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/api/webform/citizen_service_application/submit`,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        data: {
          data: {
            applicant_cpr: '0101900001',
            applicant_email: 'freja@test.dk',
            service_type: 'pension_supplement',
            reason: 'E2E smoke test',
          },
        },
        ignoreHTTPSErrors: true,
      },
    )

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.workflow, 'workflow envelope on response').toBeTruthy()

    const steps = body.workflow.steps as Array<{
      id: string
      name: string
      status: string
      description?: string
      error?: string | null
    }>

    const dpSteps = steps.filter(s => s.id === 'aabenforms_digital_post_send')

    // The action wires up successfully and runs as part of the flow.
    expect(
      dpSteps.length,
      `expected at least one aabenforms_digital_post_send step; got steps=${steps.map(s => s.id).join(',')}`,
    ).toBeGreaterThanOrEqual(1)

    // At least one of those steps must be "completed" (the success path).
    // If sender_cvr isn't configured, every step has status='failed' with a
    // pointer to the admin URL - see the spec docblock.
    const completed = dpSteps.find(s => s.status === 'completed')
    expect(
      completed,
      `expected a completed digital_post_send step; got: ${JSON.stringify(dpSteps)}`,
    ).toBeTruthy()

    // The fake_db transport surfaces "fake_db" in the step description
    // (e.g. "fake_db: payload recorded in aabenforms_digital_post_log").
    expect(
      completed!.description ?? '',
      'fake_db transport label expected in step description',
    ).toMatch(/fake_db/i)
  })

  test('subsequent submissions do not collide on transaction id', async ({ request }) => {
    // Indirect proof that TransactionIdGenerator emits unique ids per
    // call: two submissions in quick succession both succeed. If they
    // collided, the unique-key insert into aabenforms_digital_post_log
    // would fail and the second flow would surface as failed.
    const post = () => request.post(
      `${API_BASE}/api/webform/citizen_service_application/submit`,
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        data: {
          data: {
            applicant_cpr: '0101900001',
            applicant_email: 'freja@test.dk',
            service_type: 'pension_supplement',
            reason: 'E2E uniqueness probe',
          },
        },
        ignoreHTTPSErrors: true,
      },
    )

    const [a, b] = await Promise.all([post(), post()])
    expect(a.status()).toBe(201)
    expect(b.status()).toBe(201)

    const stepA = (await a.json()).workflow.steps.find(
      (s: { id: string, status: string }) => s.id === 'aabenforms_digital_post_send' && s.status === 'completed',
    )
    const stepB = (await b.json()).workflow.steps.find(
      (s: { id: string, status: string }) => s.id === 'aabenforms_digital_post_send' && s.status === 'completed',
    )
    expect(stepA, 'submission A produced a completed digital_post_send step').toBeTruthy()
    expect(stepB, 'submission B produced a completed digital_post_send step').toBeTruthy()
  })
})
