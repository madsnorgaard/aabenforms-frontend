import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Captures the backend's own ECA flow-graph renderer for the school/family
 * models. The graph is built from the STORED eca.eca.* config (see
 * EcaGraphBuilder), so what it draws is what the engine actually executes -
 * not a hand-drawn diagram that can drift from the model.
 */

const EVIDENCE_DIR = process.env.PW_EVIDENCE || path.join('test-results', 'school-family')
const ADMIN_LOGIN = process.env.ADMIN_LOGIN_URL || ''
const BACKEND = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

const FLOWS = [
  'skoleskift_flow',
  'skoleskift_decision_flow',
  'ppr_referral_flow',
  'ppr_consent_join_flow',
]

test.describe('ECA flow graphs', () => {
  test.skip(!ADMIN_LOGIN, 'ADMIN_LOGIN_URL not provided')

  test('renders the school and family flow graphs', async ({ page }) => {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })

    await page.goto(ADMIN_LOGIN, { waitUntil: 'domcontentloaded', timeout: 30000 })

    for (const flow of FLOWS) {
      await page.goto(`${BACKEND}/admin/aabenforms/flow/${flow}/graph`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      await page.waitForTimeout(2500)
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `graph-${flow}.png`),
        fullPage: true,
      })
    }

    await expect(page.locator('body')).toBeVisible()
  })
})
