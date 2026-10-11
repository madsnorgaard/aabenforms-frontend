import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Captures the interface surfaces used in the client-facing case study.
 *
 * Backend admin screens need an authenticated session, so the spec consumes a
 * one-time login link minted by drush (ADMIN_LOGIN_URL) rather than embedding
 * credentials.
 */

const SHOTS = process.env.PW_SHOTS || path.join('test-results', 'pitch')
const BACKEND = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'
const BACKEND_DIR = process.env.BACKEND_DIR || '/home/mno/ddev-projects/aabenforms/backend'
const ADMIN_LOGIN = process.env.ADMIN_LOGIN_URL || ''

function shot(name: string) {
  return path.join(SHOTS, `${name}.png`)
}

test.describe('Case study screenshots', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(() => {
    fs.mkdirSync(SHOTS, { recursive: true })
  })

  test('citizen: form rendered from the backend schema', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/forms/byggetilladelse', { waitUntil: 'commit', timeout: 25000 })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: shot('citizen-form'), fullPage: false })
    await expect(page.locator('body')).toBeVisible()
  })

  test('citizen: guided demo flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/demo/byggetilladelse', { waitUntil: 'commit', timeout: 25000 })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: shot('citizen-demo'), fullPage: false })
    await expect(page.locator('body')).toBeVisible()
  })

  test('backend: admin surfaces', async ({ page }) => {
    test.skip(!ADMIN_LOGIN, 'ADMIN_LOGIN_URL not provided')
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto(ADMIN_LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 })

    const screens: Array<[string, string]> = [
      ['admin-dashboard', `${BACKEND}/admin/aabenforms`],
      ['admin-trace', `${BACKEND}/admin/aabenforms/trace`],
      ['admin-readiness', `${BACKEND}/admin/aabenforms/readiness`],
      ['admin-templates', `${BACKEND}/admin/aabenforms/workflow-templates`],
      ['admin-eca-list', `${BACKEND}/admin/config/workflow/eca`],
    ]

    for (const [name, url] of screens) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2200)
      await page.screenshot({ path: shot(name), fullPage: false })
    }

    await expect(page.locator('body')).toBeVisible()
  })

  test('backend: the visual workflow modeler', async ({ page }) => {
    test.skip(!ADMIN_LOGIN, 'ADMIN_LOGIN_URL not provided')
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto(ADMIN_LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // The modeler edits a stored model in place.
    await page.goto(`${BACKEND}/admin/config/workflow/eca/skoleskift_flow/edit_with/workflow_modeler`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForTimeout(5000)
    await page.screenshot({ path: shot('workflow-modeler'), fullPage: false })
    await expect(page.locator('body')).toBeVisible()
  })

  test('caseworker: case inbox with real cases', async ({ page }) => {
    // The inbox reads aabenforms_case over JSON:API; capture whatever it
    // renders so the deck shows the real state, not a mock.
    const count = execSync(
      `ddev drush php:eval "print \\Drupal::entityQuery('aabenforms_case')->accessCheck(FALSE)->count()->execute();"`,
      { cwd: BACKEND_DIR, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim()
    // eslint-disable-next-line no-console
    console.log(`cases in the inbox data source: ${count}`)

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/cases/inbox', { waitUntil: 'commit', timeout: 25000 })
    await page.waitForTimeout(4000)
    await page.screenshot({ path: shot('caseworker-inbox'), fullPage: false })
    await expect(page.locator('body')).toBeVisible()
  })
})
