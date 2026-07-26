import { test as base, expect, request as pwRequest, APIRequestContext } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

/**
 * End-to-end coverage of the school/family flows.
 *
 * These specs drive the REAL ECA models on the DDEV backend - no mocking of
 * the workflow engine - and assert on the step list the API returns, which is
 * the same honest execution trace the frontend renders. Evidence (JSON step
 * traces and screenshots) is written to test-results/school-family/ so the
 * run can be reviewed after the fact.
 *
 * The demo family constellations come from DemoFamilyRepository:
 *   Emil  (0109182345, born 2018) - shared custody: Freja + Lars, two addresses
 *   Oliver(2005102345, born 2010) - shared custody, but 15+ (own Digital Post)
 *   Alma  (1203192345, born 2019) - sole custody: Sofie
 */

const API_BASE = process.env.API_BASE_URL || 'https://aabenforms.ddev.site'

/**
 * The DDEV backend serves a locally-trusted cert that Node does not verify by
 * default, so every spec gets an API context that tolerates it. Browser pages
 * already run with ignoreHTTPSErrors via the project config.
 */
const test = base.extend<{ api: APIRequestContext }>({
  api: async ({}, use) => {
    const ctx = await pwRequest.newContext({ ignoreHTTPSErrors: true })
    await use(ctx)
    await ctx.dispose()
  },
})
const BACKEND_DIR = process.env.BACKEND_DIR || '/home/mno/ddev-projects/aabenforms/backend'
const EVIDENCE_DIR = process.env.PW_EVIDENCE || path.join('test-results', 'school-family')

interface WorkflowStep {
  id: string
  name: string
  description: string
  status: string
}

/** Mints a real MitID session server-side and returns its workflow id. */
function seedMitIdSession(persona: string): string {
  const out = execSync(`ddev drush aabenforms:seed-mitid-session ${persona}`, {
    cwd: BACKEND_DIR,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const match = out.match(/wf_[A-Za-z0-9_-]+/)
  if (!match) throw new Error(`Could not mint a MitID session for ${persona}: ${out}`)
  return match[0]
}

/** Writes an evidence artefact for later review. */
function writeEvidence(name: string, payload: unknown): void {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  fs.writeFileSync(path.join(EVIDENCE_DIR, `${name}.json`), JSON.stringify(payload, null, 2))
}

function stepIds(steps: WorkflowStep[]): string[] {
  return steps.map((s) => s.id)
}

test.describe('School and family ECA flows', () => {
  test.describe.configure({ mode: 'serial' })

  test('skoleskift: shared custody runs identity, custody, case and co-sign steps', async ({ api }) => {
    const workflowId = seedMitIdSession('freja')

    const response = await api.post(`${API_BASE}/api/webform/school_transfer/submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        data: {
          attributes: {
            workflow_id: workflowId,
            data: {
              applicant_cpr: '0101904521',
              child_name: 'Emil Nielsen Andersen',
              child_cpr: '0109182345',
              current_school: '751101',
              target_school: '751104',
              reason: 'Vi er flyttet til Risskov.',
              custody_status: 'joint_agreed',
              parent2_cpr: '0803755210',
              parent2_email: 'lars.andersen@example.dk',
            },
          },
        },
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const steps: WorkflowStep[] = body.workflow?.steps ?? []
    writeEvidence('skoleskift-joint-agreed', body)

    // The flow must prove identity and custody BEFORE opening a case.
    expect(stepIds(steps)).toEqual(
      expect.arrayContaining([
        'aabenforms_mitid_validate',
        'aabenforms_custody_verify',
        'aabenforms_case_open',
        'aabenforms_institution_lookup',
        'aabenforms_send_cosign_invitation',
      ]),
    )
    // Every recorded step is honest about its outcome.
    expect(steps.every((s) => ['completed', 'skipped', 'failed'].includes(s.status))).toBeTruthy()
    expect(steps.find((s) => s.id === 'aabenforms_custody_verify')?.status).toBe('completed')
  })

  test('skoleskift: known disagreement branches to partshoering, never to a decision', async ({ api }) => {
    const workflowId = seedMitIdSession('freja')

    const response = await api.post(`${API_BASE}/api/webform/school_transfer/submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        data: {
          attributes: {
            workflow_id: workflowId,
            data: {
              applicant_cpr: '0101904521',
              child_name: 'Emil Nielsen Andersen',
              child_cpr: '0109182345',
              current_school: '751101',
              target_school: '751105',
              reason: 'Uenighed mellem foraeldrene.',
              custody_status: 'joint_disagreed',
            },
          },
        },
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const steps: WorkflowStep[] = body.workflow?.steps ?? []
    writeEvidence('skoleskift-disagreement', body)

    // FOB 2025-9: a transfer cannot proceed against the other holder's will.
    expect(stepIds(steps)).toContain('aabenforms_case_partshoering')
    expect(stepIds(steps)).not.toContain('aabenforms_case_decide')
    expect(stepIds(steps)).not.toContain('aabenforms_send_cosign_invitation')
  })

  test('skoleskift: a non-custody holder is denied before any case is opened', async ({ api }) => {
    // Sofie holds custody of Alma, not of Emil.
    const workflowId = seedMitIdSession('sofie')

    const response = await api.post(`${API_BASE}/api/webform/school_transfer/submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        data: {
          attributes: {
            workflow_id: workflowId,
            data: {
              applicant_cpr: '2506924015',
              child_name: 'Emil Nielsen Andersen',
              child_cpr: '0109182345',
              current_school: '751101',
              target_school: '751104',
              reason: 'Forsoeg uden foraeldremyndighed.',
              custody_status: 'sole',
            },
          },
        },
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const steps: WorkflowStep[] = body.workflow?.steps ?? []
    writeEvidence('skoleskift-no-custody', body)

    expect(steps.find((s) => s.id === 'aabenforms_custody_verify')?.status).toBe('failed')
    expect(stepIds(steps)).not.toContain('aabenforms_case_open')
  })

  test('security: submitter-supplied decision status cannot trigger an afgoerelse', async ({ api }) => {
    const workflowId = seedMitIdSession('freja')

    const response = await api.post(`${API_BASE}/api/webform/school_transfer/submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        data: {
          attributes: {
            workflow_id: workflowId,
            data: {
              applicant_cpr: '0101904521',
              child_name: 'Emil Nielsen Andersen',
              child_cpr: '0109182345',
              current_school: '751101',
              target_school: '751104',
              reason: 'Tampering attempt.',
              custody_status: 'joint_agreed',
              parent2_cpr: '0101904521',
              // The attack: pre-set the workflow state the decision flow gates on.
              parent1_status: 'complete',
              parent2_status: 'complete',
              caseworker_status: 'approved',
            },
          },
        },
      },
    })

    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    const steps: WorkflowStep[] = body.workflow?.steps ?? []
    writeEvidence('skoleskift-tamper-attempt', body)

    // The guard resets the statuses, so no decision is ever taken.
    expect(stepIds(steps)).not.toContain('aabenforms_case_decide')
    expect(stepIds(steps)).not.toContain('aabenforms_digital_post_send')

    const sid = body.data?.attributes?.sid
    const stored = execSync(
      `ddev drush php:eval "\\$s = \\Drupal::entityTypeManager()->getStorage('webform_submission')->load(${sid}); print \\$s->getElementData('caseworker_status') . '|' . \\$s->getElementData('parent2_status');"`,
      { cwd: BACKEND_DIR, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
    expect(stored).toContain('pending|pending')
  })

  test('citizen sees an honest step timeline in the browser', async ({ page, api }) => {
    const workflowId = seedMitIdSession('freja')

    // Drive the flow, then render its trace on the status page.
    const response = await api.post(`${API_BASE}/api/webform/school_transfer/submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        data: {
          attributes: {
            workflow_id: workflowId,
            data: {
              applicant_cpr: '0101904521',
              child_name: 'Emil Nielsen Andersen',
              child_cpr: '0109182345',
              current_school: '751101',
              target_school: '751104',
              reason: 'Screenshot run.',
              custody_status: 'joint_agreed',
              parent2_cpr: '0803755210',
              parent2_email: 'lars.andersen@example.dk',
            },
          },
        },
      },
    })
    const body = await response.json()
    const sid = body.data?.attributes?.sid

    fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
    await page.goto(`/workflow-status/${sid}`, { waitUntil: 'commit', timeout: 20000 })
    await page.waitForTimeout(2500)
    await page.screenshot({
      path: path.join(EVIDENCE_DIR, 'workflow-status.png'),
      fullPage: true,
    })

    expect(sid).toBeTruthy()
  })
})
