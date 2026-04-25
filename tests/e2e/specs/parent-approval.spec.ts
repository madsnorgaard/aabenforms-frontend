/**
 * @file
 * E2E coverage for the parent-approval token validation paths.
 *
 * Backstop for the security hardening in `aabenforms`#17 / PR #22:
 * `ApprovalTokenService::validateToken` now explicitly rejects
 * non-base64 input, malformed-no-separator, non-numeric timestamp,
 * zero/negative/far-future timestamps, and tampered hashes.
 *
 * The controller in front of the validator branches on outcome:
 *   - validateToken() FALSE + isTokenExpired() TRUE → render an
 *     "expired link" status-message page at HTTP 200 (citizen-friendly
 *     UX for the most common failure mode).
 *   - validateToken() FALSE + isTokenExpired() FALSE → throw
 *     AccessDeniedHttpException → HTTP 403.
 *   - validateToken() TRUE → render the approval form.
 *
 * Both rejection paths are security-equivalent: the submission is not
 * exposed and no approval action is possible. The spec asserts the
 * union: no malformed token should ever reach the approval form. A
 * `rejected()` predicate captures that contract.
 *
 * The valid-token positive path is deferred: it needs a signed token
 * whose HMAC matches the backend's private key. Follow-up to add a
 * drush-bridge or test-only mint endpoint.
 */

import { test, expect } from '@playwright/test'

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

/**
 * Hit the parent-approval URL with a given token and return the HTTP
 * status + body text. Both are needed because the controller may
 * return 403 OR 200-with-expired-message depending on token shape.
 */
async function probe(request: any, token: string, parent = 1, submissionId = 1) {
  const url = `${API_BASE}/parent-approval/${parent}/${submissionId}/${encodeURIComponent(token)}`
  const response = await request.get(url, {
    ignoreHTTPSErrors: true,
    maxRedirects: 0,
    failOnStatusCode: false,
  })
  return {
    status: response.status(),
    body: await response.text(),
  }
}

/**
 * The contract: a rejected token EITHER returns 403 OR renders the
 * expired-link friendly UI. Either way, no approval form is shown.
 */
function assertRejected(result: { status: number, body: string }, label: string) {
  const expiredUx = result.status === 200
    && /expired|invalid/i.test(result.body)
    && !/<form[^>]*data-approval-form/i.test(result.body)

  const hardDenied = result.status === 403

  expect(
    expiredUx || hardDenied,
    `${label}: expected 403 or 200-with-expired-message; got status=${result.status}, body length=${result.body.length}`,
  ).toBe(true)
}

test.describe('parent-approval token validation', () => {
  test('non-base64 garbage is rejected', async ({ request }) => {
    const r = await probe(request, '!!!not-base64!!!')
    assertRejected(r, 'non-base64')
  })

  test('valid base64 with no colon separator is rejected', async ({ request }) => {
    // Pre-#17 this would PHP-fatal on the unconditional list-assignment
    // or fall through to (int) '' === 0 = "valid in 1970".
    const token = Buffer.from('no-colon-here').toString('base64')
    const r = await probe(request, token)
    assertRejected(r, 'no-separator')
  })

  test('non-numeric timestamp is rejected', async ({ request }) => {
    // Pre-#17, `(int) 'abc' === 0` and the token tested as "valid in 1970".
    const token = Buffer.from('somehash:not-a-number').toString('base64')
    const r = await probe(request, token)
    assertRejected(r, 'non-numeric-timestamp')
  })

  test('zero timestamp is rejected', async ({ request }) => {
    const token = Buffer.from('somehash:0').toString('base64')
    const r = await probe(request, token)
    assertRejected(r, 'zero-timestamp')
  })

  test('negative timestamp is rejected', async ({ request }) => {
    const token = Buffer.from('somehash:-12345').toString('base64')
    const r = await probe(request, token)
    assertRejected(r, 'negative-timestamp')
  })

  test('far-future timestamp beyond drift slack is rejected', async ({ request }) => {
    // Far enough in the future that the +3600s drift slack is exceeded.
    const future = Math.floor(Date.now() / 1000) + 86400
    const token = Buffer.from(`somehash:${future}`).toString('base64')
    const r = await probe(request, token)
    assertRejected(r, 'far-future-timestamp')
  })

  test('tampered HMAC with valid timestamp is rejected with 403', async ({ request }) => {
    // The HMAC is wrong but the timestamp is current, so isTokenExpired
    // returns FALSE and the controller throws AccessDeniedHttpException.
    // This is the only path that *must* return 403 (not the expired UX).
    const now = Math.floor(Date.now() / 1000)
    const token = Buffer.from(`deadbeef${'a'.repeat(56)}:${now}`).toString('base64')
    const r = await probe(request, token)
    expect(r.status, 'tampered HMAC must return hard 403').toBe(403)
  })

  test.skip('valid token returns 200 (deferred — needs drush token-mint bridge)', () => {
    // Requires a way to mint a real signed token from the test runner.
    // Either add a backend test-only route guarded by environment, or
    // shell out to `ddev drush php:eval` from the Playwright runner.
  })
})
