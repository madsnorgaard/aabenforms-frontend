import type { User } from '~/types/user'

/**
 * Guided demo scenarios ("vi spørger ikke om det, vi allerede ved").
 *
 * One `DemoScenarioConfig` per scenario drives `useDemoScenario()` and the
 * `DemoScenarioWizard` shell. The hub at /demo lists the same configs as
 * DKFDS cards, so a scenario is added in exactly one place:
 * `composables/scenarios/<id>.ts`, registered in `composables/scenarios/index.ts`.
 */

/** Wizard phases, in order. `submitting` and `workflow` are transient. */
export type DemoPhase =
  | 'idle'
  | 'login'
  | 'prefill'
  | 'form'
  | 'submitting'
  | 'workflow'
  | 'letter'
  | 'complete'

/** The five DKFDS Trinindikator steps of every scenario. */
export type DemoStepId = 'login' | 'prefill' | 'form' | 'workflow' | 'letter'

export const DEMO_STEP_IDS: readonly DemoStepId[] = ['login', 'prefill', 'form', 'workflow', 'letter'] as const

/** Which step a phase belongs to (0-based). */
export const DEMO_PHASE_STEP: Record<DemoPhase, number> = {
  idle: 0,
  login: 0,
  prefill: 1,
  form: 2,
  submitting: 2,
  workflow: 3,
  letter: 4,
  complete: 4,
}

/** Honest rail status as delivered by GET /api/prefill. Never hide `demo`. */
export type DemoRailMode = 'live' | 'live-capable' | 'demo'

export type DemoDifficulty = 'simple' | 'medium' | 'advanced'

// --- GET /api/prefill/{webform_id}?session={workflow_id} -------------------

export interface PrefillSource {
  register: string
  contract: string
  mode: DemoRailMode
  label: string
}

/** A list source entry (a child, a case). Shape depends on the register. */
export type PrefillOption = Record<string, unknown>

export interface PrefillField {
  value: string | number | boolean | null
  options?: PrefillOption[]
  source: PrefillSource
  legal_basis: string
  fetched_at: string
  audit_id: number | null
}

export interface PrefillSession {
  name: string
  assurance_level: string
  digital_post_exempt: boolean
  seeded: boolean
}

export interface PrefillResponse {
  webform: string
  fields: Record<string, PrefillField>
  /** element keys the citizen still has to answer */
  not_asked: string[]
  session: PrefillSession
}

// --- Submit response and Digital Post -------------------------------------

export interface WorkflowStep {
  id: string
  name: string
  description?: string
  status: 'completed' | 'failed' | 'skipped'
  error?: string | null
  completed_at?: string
}

export interface SubmissionResponse {
  data?: { id?: string | number }
  workflow?: {
    status?: string
    step_count?: number
    steps?: WorkflowStep[]
  }
  message?: string
  error?: string
  errors?: Record<string, string>
}

export interface DigitalPostLetter {
  transaction_id: string
  subject: string
  body_html: string
  status: string
  created: number
  created_iso: string
}

// --- Scenario config -------------------------------------------------------

export interface DemoPersona {
  /** Keycloak username shown in the login step (mock MitID). */
  username: string
  password: string
  /** Display name, e.g. "Freja Nielsen". */
  name: string
}

/** How to turn a list source (`options`) into a radio choice. */
export interface DemoOptionShape {
  /** property of the option object used as the radio value (must be unique) */
  valueProp: string
  /** property shown as the radio label */
  labelProp: string
  /** properties joined as the radio hint, e.g. ['cpr', 'birth_date'] */
  hintProps?: string[]
}

/** One row of the provenance table ("Det spurgte vi ikke om"). */
export interface DemoPrefillMapEntry {
  /** key in the prefill response `fields` */
  key: string
  /** i18n key for the "Oplysning" column */
  labelKey: string
  /** form value key that receives the value; defaults to `key` */
  formKey?: string
  /** present when the field carries `options` (children, cases) */
  option?: DemoOptionShape
  /** the citizen may overwrite the fetched value in step 3 (an input is rendered, prefilled) */
  editable?: boolean
  /** i18n key for the hint under the editable input */
  editHintKey?: string
  /** display formatting of a scalar value (e.g. "150.000 kr.") */
  format?: (value: PrefillField['value']) => string
  /**
   * Value derived from the MitID session claims when the endpoint does not
   * return the key (e.g. the mock IdP's address claims). Must label its own
   * source honestly: real MitID does not issue address claims, so `demo`.
   */
  sessionFallback?: (user: User) => { value: string; source: PrefillSource } | null
}

export interface DemoFormOption {
  value: string
  labelKey: string
}

/** A field the citizen types in step 3 ("Det kun du ved"). */
export interface DemoFormField {
  /** form value key; also the webform element key for the `not_asked` list */
  key: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio'
  labelKey: string
  hintKey?: string
  placeholderKey?: string
  required?: boolean
  /** i18n key for the validation message; defaults to demo.wizard.validation.required with {field} */
  errorKey?: string
  options?: DemoFormOption[]
  rows?: number
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
  /** basic range check for `number` */
  min?: number
  max?: number
}

export interface DemoSubmitContext {
  /** step-3 values, including editable prefill overrides (keyed by formKey) */
  values: Record<string, string>
  prefill: PrefillResponse | null
  /** chosen option object per prefill key that had `options` */
  choices: Record<string, PrefillOption | null>
  user: User | null
  /** the MitID workflow id (bearer capability from login) */
  sessionId: string
}

export interface DemoOutcome {
  /**
   * Which letter counts as this scenario's outcome. Defaults to any letter
   * created after the submission.
   */
  letterMatches?: (letter: DigitalPostLetter) => boolean
  /** i18n keys for the completion alert */
  headingKey: string
  bodyKey: string
}

export interface DemoStepOverride {
  titleKey?: string
  hintKey?: string
}

export interface DemoScenarioConfig {
  /** route segment and storage key, e.g. 'byggetilladelse' */
  id: string
  /** Drupal webform machine name, e.g. 'building_permit' */
  webformId: string
  /** wizard route, e.g. '/demo/byggetilladelse' */
  path: string
  /** false renders a "kommer" card on the hub and no link */
  available: boolean
  difficulty: DemoDifficulty
  persona: DemoPersona
  /** i18n keys: card and page title, one-line story (card), intro paragraph (page) */
  titleKey: string
  storyKey: string
  introKey: string
  /** hub card lists ("Hentes automatisk", "Du skriver selv"): i18n keys */
  fetchedKeys: string[]
  typedKeys: string[]
  /** step 2 rows; order is the table order */
  prefillMap: DemoPrefillMapEntry[]
  /** step 3 fields; order is the form order */
  form: DemoFormField[]
  /** POST body for /api/webform/{webformId}/submit */
  submitBody: (ctx: DemoSubmitContext) => Record<string, unknown>
  outcome: DemoOutcome
  /** "Hvad sker der bag kulisserne" per step, i18n keys; missing steps fall back to demo.wizard.commentary.* */
  commentaryKeys?: Partial<Record<DemoStepId, string>>
  /** optional step title/hint overrides; defaults are demo.wizard.steps.* */
  steps?: Partial<Record<DemoStepId, DemoStepOverride>>
  /** i18n key for the login step body; defaults to demo.wizard.login.body */
  loginBodyKey?: string
  /** i18n key for the step 3 intro; defaults to demo.wizard.form.body */
  formBodyKey?: string
}

/** A row ready for DemoProvenancePanel (derived from the config + response). */
export interface DemoProvenanceRow {
  key: string
  formKey: string
  label: string
  /** display value, masked as delivered by the backend */
  display: string
  raw: PrefillField['value']
  source: PrefillSource
  legalBasis: string
  fetchedAt: string
  auditId: number | null
  /** radio options when the field is a list source */
  options?: Array<{ value: string; label: string; hint?: string }>
  editable: boolean
}

/** What is persisted in sessionStorage across the MitID redirect. */
export interface DemoPersistedState {
  phase: DemoPhase
  pendingLogin: boolean
  values: Record<string, string>
  choices: Record<string, string>
  submissionId: string
  submittedAt: number
}
