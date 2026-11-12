import { test, expect } from '@playwright/test'

/**
 * Content-Security-Policy (server/plugins/csp.ts).
 *
 * Checks the header on an HTML response and, more importantly, that the
 * public pages load and hydrate without a single CSP violation: a policy
 * that blocks the app's own scripts would pass the header check and break
 * the site. Runs against a built server (nuxt preview or the container);
 * the dev server does not send the policy.
 */

const PUBLIC_PAGES = ['/', '/en', '/demo', '/en/demo', '/demo/byggetilladelse', '/kontakt']

function directives(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const part of csp.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/)
    if (name) map.set(name, values)
  }
  return map
}

test.describe('security headers', () => {
  test('HTML responses carry a hash-based Content-Security-Policy', async ({ request }) => {
    const response = await request.get('/')
    expect(response.ok()).toBeTruthy()
    const csp = response.headers()['content-security-policy']
    expect(csp, 'Content-Security-Policy header missing').toBeTruthy()

    const policy = directives(csp!)
    const scriptSrc = policy.get('script-src') ?? []
    expect(scriptSrc).toContain("'self'")
    expect(scriptSrc.some((v) => /^'sha256-[A-Za-z0-9+/=]+'$/.test(v)), 'inline script hash missing').toBeTruthy()
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    expect(scriptSrc).not.toContain("'unsafe-eval'")
    expect(policy.get('object-src')).toEqual(["'none'"])
    expect(policy.get('base-uri')).toEqual(["'self'"])
    expect(policy.get('frame-ancestors')).toEqual(["'self'"])
    expect(policy.get('frame-src')).toEqual(["'none'"])
    expect(policy.get('connect-src')).toContain("'self'")
    expect(policy.get('default-src')).toEqual(["'self'"])
  })

  test('public pages load and hydrate without CSP violations', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cspViolations: string[] }
      w.__cspViolations = []
      document.addEventListener('securitypolicyviolation', (event) => {
        w.__cspViolations.push(
          `${event.violatedDirective} blocked ${event.blockedURI || 'inline'} at ${event.sourceFile || event.documentURI}:${event.lineNumber}`,
        )
      })
    })
    const cspConsoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' && /Content Security Policy|Refused to/.test(message.text())) {
        cspConsoleErrors.push(message.text())
      }
    })

    for (const path of PUBLIC_PAGES) {
      await page.goto(path, { waitUntil: 'networkidle' })
      // Vue marks the root element once the app has mounted (hydration ran).
      await expect
        .poll(() => page.evaluate(() => Boolean((document.querySelector('#__nuxt') as unknown as { __vue_app__?: unknown })?.__vue_app__)), {
          message: `app did not hydrate on ${path}`,
        })
        .toBe(true)
      const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)
      expect(violations, `CSP violations on ${path}`).toEqual([])
    }
    expect(cspConsoleErrors).toEqual([])
  })

  test('the session routes are never cached', async ({ request }) => {
    const response = await request.get('/api/session/me')
    expect(response.headers()['cache-control']).toContain('no-store')
    expect(response.headers()['access-control-allow-origin']).toBeUndefined()
  })
})
