import { test, expect, type Page } from '@playwright/test'

// The caseworker inbox is auth-gated (definePageMeta middleware: 'auth').
// This smoke test proves the gate: an unauthenticated visit to /cases/inbox
// must not render the inbox - it redirects to the landing page with the
// auth=required flag. Mirrors the protected-route pattern in auth.spec.ts.
// One shared page per block to avoid the Nuxt dev SSR multi-render crash.

test.describe('Caseworker inbox - auth gate', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/cases/inbox', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForLoadState('domcontentloaded', { timeout: 15000 })
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('unauthenticated user is redirected away from /cases/inbox', async () => {
    const url = sharedPage.url()
    const path = new URL(url).pathname
    const redirected = url.includes('auth=required') || /^\/(en|da)?\/?$/.test(path)
    expect(redirected).toBeTruthy()
  })

  test('inbox content is not exposed before authentication', async () => {
    // The case table must not be present on the redirected page.
    await expect(sharedPage.locator('table.inbox-table')).toHaveCount(0)
  })
})
