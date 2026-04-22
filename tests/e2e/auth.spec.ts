import { test, expect, type Page } from '@playwright/test'
import { testUsers, loginWithMitId } from '../fixtures/test-helpers'

// Nuxt SSR dev server crashes after ~7 rapid full renders, matching the
// pattern already used by landing.spec.ts and workflows.spec.ts. Each
// describe block owns one shared page, so each block triggers at most
// one Nuxt render. Tests inside a block read state from that single page.

test.describe('MitID Authentication - Landing', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // AuthLoginButton sits inside <ClientOnly> - wait for client hydration.
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('MitID login button is visible on landing page', async () => {
    await expect(sharedPage.getByRole('button', { name: /MitID/i })).toBeVisible()
  })
})

test.describe('MitID Authentication - Keycloak redirect', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // AuthLoginButton sits inside <ClientOnly> - wait for client hydration.
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
    await sharedPage.getByRole('button', { name: /MitID/i }).click()
    await sharedPage.waitForURL(/localhost:8080|keycloak/, { timeout: 20000 })
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('clicking MitID button redirects to Keycloak', async () => {
    await expect(sharedPage.locator('#username, #kc-form-login')).toBeVisible({ timeout: 10000 })
  })

  test('Keycloak shows Danish test realm login page', async () => {
    expect(sharedPage.url()).toContain('danish-gov-test')
  })
})

test.describe('MitID Authentication - Protected Routes', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/workflows/tasks', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForLoadState('domcontentloaded', { timeout: 15000 })
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('unauthenticated user redirected from /workflows/tasks', async () => {
    const url = sharedPage.url()
    const path = new URL(url).pathname
    const redirected = url.includes('auth=required') || /^\/(en|da)?\/?$/.test(path)
    expect(redirected).toBeTruthy()
  })
})

test.describe('MitID Authentication - Citizen login (freja.nielsen)', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // AuthLoginButton sits inside <ClientOnly> - wait for client hydration.
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
    await loginWithMitId(sharedPage, testUsers.citizen)
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('login with test user freja.nielsen lands back on frontend', async () => {
    await expect(sharedPage).toHaveURL(/aabenforms-frontend\.ddev\.site|localhost:300/)
  })
})

test.describe('MitID Authentication - Business owner login (karen.christensen)', () => {
  test.describe.configure({ mode: 'serial' })
  let sharedPage: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ ignoreHTTPSErrors: true })
    sharedPage = await context.newPage()
    await sharedPage.goto('/', { waitUntil: 'commit', timeout: 20000 })
    await sharedPage.waitForSelector('h1', { timeout: 15000 })
    // AuthLoginButton sits inside <ClientOnly> - wait for client hydration.
    await sharedPage.waitForSelector('button:has-text("MitID")', { timeout: 15000 })
    await loginWithMitId(sharedPage, testUsers.businessOwner)
  })

  test.afterAll(async () => { await sharedPage?.context().close() })

  test('login with case owner karen.christensen lands back on frontend', async () => {
    await expect(sharedPage).toHaveURL(/aabenforms-frontend\.ddev\.site|localhost:300/)
  })
})
