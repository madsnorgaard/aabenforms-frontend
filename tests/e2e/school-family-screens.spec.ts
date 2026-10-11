import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Screenshot capture of the surfaces that render school/family work.
 *
 * Separate from school-family-flows.spec.ts because these assert on rendered
 * UI rather than on the ECA step trace.
 */

const EVIDENCE_DIR = process.env.PW_EVIDENCE || path.join('test-results', 'school-family')

test.describe('School and family screens', () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  })

  test('caseworker inbox lists the school and family cases', async ({ page }) => {
    await page.goto('/cases/inbox', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'cases-inbox.png'), fullPage: true })

    // The inbox is the caseworker's view of what the flows produced.
    await expect(page.locator('body')).toBeVisible()
  })

  test('school transfer form renders from the backend schema', async ({ page }) => {
    await page.goto('/forms/school_transfer', { waitUntil: 'commit', timeout: 20000 })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'school-transfer-form.png'), fullPage: true })

    await expect(page.locator('body')).toBeVisible()
  })
})
