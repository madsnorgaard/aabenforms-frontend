import type { User } from '~/types/user'
import type {
  DemoPersistedState,
  DemoDateFormat,
  DemoPhase,
  DemoProvenanceRow,
  DemoReceiptRow,
  DemoScenarioConfig,
  DigitalPostLetter,
  PrefillField,
  PrefillOption,
  SubmissionResponse,
  WorkflowStep,
} from '~/types/demo'
import { DEMO_PHASE_STEP } from '~/types/demo'
import { useUserStore } from '~/stores/user'

/**
 * Orchestrates one guided demo scenario (generalises the former
 * useByggetilladelseDemo).
 *
 * Phases: idle -> login -> prefill -> form -> submitting -> workflow ->
 * letter -> complete. Every transition rides on a real backend signal (the
 * MitID callback session, the prefill response, the submit response, the
 * Digital Post inbox poll). The only pacing is the per-step reveal pause in
 * `workflow`, so the citizen sees the chain run; the steps themselves
 * executed synchronously inside the submit POST.
 *
 * Phase, typed values and option choices are persisted in sessionStorage per
 * scenario so the MitID redirect round-trip (/mitid/login -> Keycloak ->
 * /auth/callback -> back here) resumes where it left off.
 */

const INBOX_POLL_DELAYS_MS = [600, 1200, 2000, 2500]
const STEP_REVEAL_MS = 550

type Choices = Record<string, string>

export const useDemoScenario = (config: DemoScenarioConfig) => {
  const { apiBase } = useRuntimeConfig().public
  const { t, locale } = useI18n()
  const { user, sessionId, isAuthenticated } = useAuth()
  const userStore = useUserStore()
  const prefill = usePrefill()

  const storageKey = `aabenforms-demo:${config.id}`

  const phase = ref<DemoPhase>('idle')
  /** true between the login click and the callback return */
  const pendingLogin = ref(false)
  const values = ref<Record<string, string>>({})
  /** chosen radio value per prefill key with options */
  const choices = ref<Choices>({})
  const fieldErrors = ref<Record<string, string>>({})

  const workflowSteps = ref<WorkflowStep[]>([])
  const animatedStepIndex = ref(-1)
  const submissionId = ref('')
  const submittedAt = ref(0)

  const inboxLetters = ref<DigitalPostLetter[]>([])
  const inboxLoading = ref(false)
  const inboxAttempts = ref(0)

  const error = ref<string | null>(null)
  const restored = ref(false)

  const stepIndex = computed(() => DEMO_PHASE_STEP[phase.value])
  const busy = computed(() => phase.value === 'submitting' || phase.value === 'workflow')

  // --- persistence --------------------------------------------------------

  function persist() {
    if (!import.meta.client || !restored.value) return
    const state: DemoPersistedState = {
      phase: phase.value,
      pendingLogin: pendingLogin.value,
      values: values.value,
      choices: choices.value,
      submissionId: submissionId.value,
      submittedAt: submittedAt.value,
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state))
    }
    catch {
      // Storage can be unavailable (private mode); the demo still runs.
    }
  }

  function restore() {
    if (!import.meta.client) return
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw) {
        const s = JSON.parse(raw) as Partial<DemoPersistedState>
        values.value = s.values ?? {}
        choices.value = s.choices ?? {}
        pendingLogin.value = Boolean(s.pendingLogin)
        submissionId.value = s.submissionId ?? ''
        submittedAt.value = s.submittedAt ?? 0
        const p = s.phase ?? 'idle'
        // Transient phases cannot be resumed: back to the form.
        phase.value = p === 'submitting' || p === 'workflow' ? 'form' : p === 'letter' ? 'complete' : p
      }
    }
    catch {
      // Ignore a corrupt entry.
    }
    finally {
      restored.value = true
    }
  }

  watch([phase, pendingLogin, values, choices, submissionId], persist, { deep: true })

  // --- formatting ---------------------------------------------------------

  /** "30. september 2026" (da) / "30 September 2026" (en); '' for no value. */
  const formatDate: DemoDateFormat = (value) => {
    if (value === null || value === undefined || value === '') return ''
    const d = new Date(typeof value === 'number' ? value : String(value))
    if (Number.isNaN(d.getTime())) return String(value)
    return new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }

  const translate = (key: string, params?: Record<string, unknown>) => t(key, params ?? {})

  // --- provenance rows ----------------------------------------------------

  function optionValue(opt: PrefillOption, prop: string): string {
    const v = opt[prop]
    return v === null || v === undefined ? '' : String(v)
  }

  function optionLabel(entry: DemoScenarioConfig['prefillMap'][number], opt: PrefillOption): string {
    return entry.option ? optionValue(opt, entry.option.labelProp) : ''
  }

  function displayValue(entry: DemoScenarioConfig['prefillMap'][number], field: PrefillField): string {
    if (field.options && entry.option) {
      const chosen = chosenOption(entry.key)
      if (chosen) return optionLabel(entry, chosen)
      if (field.value === null || field.value === undefined) return ''
    }
    if (field.value === null || field.value === undefined || field.value === '') return ''
    return entry.format ? entry.format(field.value) : String(field.value)
  }

  function chosenOption(key: string): PrefillOption | null {
    const entry = config.prefillMap.find((e) => e.key === key)
    const field = prefill.data.value?.fields[key]
    if (!entry?.option || !field?.options) return null
    const value = choices.value[key]
    if (!value) return null
    return field.options.find((o) => optionValue(o, entry.option!.valueProp) === value) ?? null
  }

  function optionHint(shape: NonNullable<DemoScenarioConfig['prefillMap'][number]['option']>, o: PrefillOption): string | undefined {
    if (shape.hintFormat) return shape.hintFormat(o, translate, formatDate) || undefined
    return shape.hintProps?.map((p) => optionValue(o, p)).filter(Boolean).join(' - ') || undefined
  }

  const rows = computed<DemoProvenanceRow[]>(() => {
    const data = prefill.data.value
    const out: DemoProvenanceRow[] = []
    const anyLegal = data ? Object.values(data.fields)[0]?.legal_basis ?? '' : ''
    for (const entry of config.prefillMap) {
      const field = data?.fields[entry.key]
      const formKey = entry.formKey ?? entry.key
      if (field) {
        out.push({
          key: entry.key,
          formKey,
          label: t(entry.labelKey),
          display: displayValue(entry, field),
          raw: field.value,
          source: field.source,
          legalBasis: field.legal_basis,
          fetchedAt: field.fetched_at,
          auditId: field.audit_id,
          editable: Boolean(entry.editable),
          choiceHintKey: entry.option?.choiceHintKey,
          options: field.options && entry.option
            ? field.options.map((o) => ({
                value: optionValue(o, entry.option!.valueProp),
                label: optionLabel(entry, o),
                hint: optionHint(entry.option!, o),
                disabled: entry.option!.disabledWhen ? entry.option!.disabledWhen(o) : undefined,
              }))
            : undefined,
        })
        continue
      }
      if (entry.sessionFallback && user.value) {
        const fb = entry.sessionFallback(user.value as User)
        if (fb) {
          out.push({
            key: entry.key,
            formKey,
            label: t(entry.labelKey),
            display: fb.value,
            raw: fb.value,
            source: fb.source,
            legalBasis: anyLegal,
            fetchedAt: '',
            auditId: null,
            editable: Boolean(entry.editable),
          })
        }
      }
    }
    return out
  })

  /** Element keys the citizen still has to answer, minus session fallbacks. */
  const notAsked = computed<string[]>(() => {
    const covered = new Set(rows.value.map((r) => r.key))
    return (prefill.data.value?.not_asked ?? []).filter((k) => !covered.has(k))
  })

  /** Rows with options where no choice has been made yet. */
  const missingChoices = computed(() =>
    rows.value.filter((r) => r.options && r.options.length > 0 && !choices.value[r.key]),
  )

  /** Chosen option objects keyed by prefill key (for submitBody). */
  const chosenOptions = computed<Record<string, PrefillOption | null>>(() => {
    const out: Record<string, PrefillOption | null> = {}
    for (const row of rows.value) {
      if (row.options) out[row.key] = chosenOption(row.key)
    }
    return out
  })

  // --- prefill ------------------------------------------------------------

  async function loadPrefill() {
    error.value = null
    const res = await prefill.load(config.webformId, sessionId.value)
    if (!res) {
      if (prefill.error.value === 'unauthenticated') {
        // The 15 minute session is gone: log out and start over.
        userStore.clearSession()
        pendingLogin.value = false
        phase.value = 'idle'
        error.value = 'session_expired'
      }
      else {
        error.value = prefill.error.value === 'not_found' ? 'form_not_found' : 'prefill_failed'
      }
      return
    }
    // Default choice: a single option, the first enabled one when the shape
    // disables some, or the option matching the delivered value.
    for (const entry of config.prefillMap) {
      const field = res.fields[entry.key]
      if (!field?.options || !entry.option) continue
      const disabledWhen = entry.option.disabledWhen
      const current = choices.value[entry.key]
      if (current) {
        // A persisted choice that is no longer allowed (already appealed) is dropped.
        const opt = field.options.find((o) => optionValue(o, entry.option!.valueProp) === current)
        if (opt && !(disabledWhen && disabledWhen(opt))) continue
        delete choices.value[entry.key]
      }
      if (disabledWhen) {
        const first = field.options.find((o) => !disabledWhen(o))
        if (first) choices.value[entry.key] = optionValue(first, entry.option.valueProp)
      }
      else if (field.options.length === 1) {
        choices.value[entry.key] = optionValue(field.options[0]!, entry.option.valueProp)
      }
      else if (field.value !== null && field.value !== undefined) {
        const match = field.options.find((o) => optionValue(o, entry.option!.labelProp) === String(field.value)
          || optionValue(o, entry.option!.valueProp) === String(field.value))
        if (match) choices.value[entry.key] = optionValue(match, entry.option.valueProp)
      }
    }
    // Editable fetched values seed the step 3 input once.
    for (const row of rows.value) {
      if (row.editable && !(row.formKey in values.value) && row.display) {
        values.value[row.formKey] = row.display
      }
    }
  }

  async function goPrefill() {
    phase.value = 'prefill'
    await loadPrefill()
  }

  /**
   * Called on mount and whenever the user store (re)hydrates. On the initial
   * call the store has not restored localStorage yet, so an unauthenticated
   * state is not conclusive; the wizard calls again once auth has settled.
   */
  function syncFromAuth(initial = false) {
    if (!restored.value) restore()
    if (!isAuthenticated.value) {
      if (!initial && phase.value !== 'idle' && phase.value !== 'login' && !userStore.loading) {
        // Session vanished (expired, logged out elsewhere): start over.
        phase.value = 'idle'
      }
      return
    }
    if (phase.value === 'idle' || (phase.value === 'login' && pendingLogin.value)) {
      pendingLogin.value = false
      void goPrefill()
    }
    else if (phase.value === 'prefill' && !prefill.data.value && !prefill.loading.value) {
      void loadPrefill()
    }
    else if (phase.value === 'form' && !prefill.data.value && !prefill.loading.value) {
      void loadPrefill()
    }
    else if (phase.value === 'complete' && inboxLetters.value.length === 0) {
      void refreshInbox()
    }
  }

  /**
   * Called right before the MitID redirect (capture-phase click on the
   * LoginButton) so the persisted phase says "waiting for the callback".
   */
  function startLogin() {
    phase.value = 'login'
    pendingLogin.value = true
    error.value = null
    persist()
  }

  // --- navigation ---------------------------------------------------------

  const PHASE_FOR_STEP: DemoPhase[] = ['login', 'prefill', 'form', 'workflow', 'letter']

  /** Step indicator click: only completed steps are links; never during submit. */
  function goToStep(index: number) {
    if (busy.value) return
    if (index >= stepIndex.value) return
    const target = PHASE_FOR_STEP[index]
    if (!target || target === 'workflow' || target === 'letter') return
    if (target === 'login' && !isAuthenticated.value) {
      phase.value = 'idle'
      return
    }
    phase.value = target
  }

  function continueToForm() {
    if (missingChoices.value.length > 0) return
    fieldErrors.value = {}
    phase.value = 'form'
  }

  // --- validation and submit ---------------------------------------------

  function validate(): boolean {
    const errors: Record<string, string> = {}
    for (const field of config.form) {
      const raw = (values.value[field.key] ?? '').toString().trim()
      const label = t(field.labelKey)
      if (field.required && !raw) {
        errors[field.key] = field.errorKey ? t(field.errorKey) : t('demo.wizard.validation.required', { field: label })
        continue
      }
      if (field.type === 'number' && raw) {
        const n = Number(raw.replace(',', '.'))
        if (Number.isNaN(n)) errors[field.key] = t('demo.wizard.validation.number', { field: label })
        else if (field.min !== undefined && n < field.min) errors[field.key] = t('demo.wizard.validation.min', { field: label, min: field.min })
        else if (field.max !== undefined && n > field.max) errors[field.key] = t('demo.wizard.validation.max', { field: label, max: field.max })
      }
    }
    for (const row of rows.value) {
      if (row.editable && !(values.value[row.formKey] ?? '').trim()) {
        errors[row.formKey] = t('demo.wizard.validation.required', { field: row.label })
      }
    }
    fieldErrors.value = errors
    return Object.keys(errors).length === 0
  }

  function clearFieldError(key: string) {
    if (fieldErrors.value[key]) {
      const next = { ...fieldErrors.value }
      delete next[key]
      fieldErrors.value = next
    }
  }

  async function submit(): Promise<void> {
    if (!isAuthenticated.value || !user.value || !sessionId.value) {
      error.value = 'not_authenticated'
      return
    }
    if (!validate()) return
    error.value = null
    phase.value = 'submitting'
    submittedAt.value = Date.now()

    // Prefilled, non-editable values travel too (the scenario decides).
    const merged: Record<string, string> = { ...values.value }
    for (const row of rows.value) {
      if (!row.editable && row.display && !(row.formKey in merged)) merged[row.formKey] = row.display
    }

    const body = config.submitBody({
      values: merged,
      prefill: prefill.data.value,
      choices: chosenOptions.value,
      user: user.value as User,
      sessionId: sessionId.value,
    })

    try {
      const res = await $fetch<SubmissionResponse>(
        `${apiBase}/api/webform/${encodeURIComponent(config.webformId)}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body,
        },
      )
      workflowSteps.value = res.workflow?.steps ?? []
      submissionId.value = String(res.data?.id ?? '')

      phase.value = 'workflow'
      animatedStepIndex.value = -1
      await animateSteps()

      phase.value = 'letter'
      if (pollsInbox.value) {
        await pollInbox()
      }
      else {
        // No letter for the applicant: show the inbox as it is, once.
        void refreshInbox()
      }
      phase.value = 'complete'
    }
    catch (e: any) {
      error.value = e?.data?.error || e?.data?.message || e?.message || 'submit_failed'
      phase.value = 'form'
    }
  }

  async function animateSteps(): Promise<void> {
    for (let i = 0; i < workflowSteps.value.length; i++) {
      animatedStepIndex.value = i
      await new Promise((r) => setTimeout(r, STEP_REVEAL_MS))
    }
  }

  function isOutcome(letter: DigitalPostLetter): boolean {
    if (config.outcome.letterMatches && !config.outcome.letterMatches(letter)) return false
    // Prefer letters written after this submission (a re-run must not be
    // satisfied by the previous run's letter); 5 s skew tolerance.
    return !submittedAt.value || letter.created * 1000 >= submittedAt.value - 5000
  }

  /** The letter this run produced, if the inbox has it. */
  const outcomeLetter = computed<DigitalPostLetter | null>(
    () => inboxLetters.value.find(isOutcome) ?? null,
  )

  /** Poll the applicant's inbox for the outcome letter (default). */
  const pollsInbox = computed(() =>
    config.outcome.expectLetter !== false && config.outcome.letterRecipient !== 'other',
  )

  /** A workflow step failed: the outcome alert and receipt must not claim success. */
  const workflowFailed = computed(() => workflowSteps.value.some((s) => s.status === 'failed'))

  /** The outcome alert may show: the letter arrived, or none is expected for the applicant. */
  const outcomeReady = computed(() => !workflowFailed.value && (!pollsInbox.value || Boolean(outcomeLetter.value)))

  /** Receipt rows for the summary list under the outcome alert (empty values skipped). */
  const receiptRows = computed<DemoReceiptRow[]>(() => {
    if (!config.outcome.receipt || workflowFailed.value) return []
    return config.outcome.receipt({
      values: values.value,
      choices: chosenOptions.value,
      submissionId: submissionId.value,
      t: translate,
      d: formatDate,
    }).filter((r) => r.value)
  })

  /** Step 2 alert derived from the prefill response. */
  const prefillAlert = computed(() => {
    const data = prefill.data.value
    return data && config.prefillAlert ? config.prefillAlert(data) : null
  })

  async function pollInbox(): Promise<void> {
    inboxAttempts.value = 0
    for (const delay of INBOX_POLL_DELAYS_MS) {
      await new Promise((r) => setTimeout(r, delay))
      await refreshInbox()
      inboxAttempts.value++
      if (outcomeLetter.value) return
    }
  }

  async function refreshInbox(): Promise<void> {
    if (!sessionId.value) return
    inboxLoading.value = true
    try {
      const res = await $fetch<{ data?: DigitalPostLetter[] }>(
        `${apiBase}/api/digital-post/recent?session=${encodeURIComponent(sessionId.value)}&limit=5`,
        { headers: { Accept: 'application/json' } },
      )
      inboxLetters.value = res.data ?? []
    }
    catch (e: any) {
      // The empty state handles "no letters yet"; do not override the primary error.
      console.error('Inbox fetch failed:', e)
    }
    finally {
      inboxLoading.value = false
    }
  }

  // --- reset --------------------------------------------------------------

  function clearRun() {
    values.value = {}
    choices.value = {}
    fieldErrors.value = {}
    workflowSteps.value = []
    animatedStepIndex.value = -1
    submissionId.value = ''
    submittedAt.value = 0
    inboxLetters.value = []
    inboxAttempts.value = 0
    error.value = null
  }

  /** "Kør igen": keep the login, fetch the registers afresh (new audit rows). */
  async function reset() {
    clearRun()
    prefill.clear()
    if (isAuthenticated.value) {
      await goPrefill()
    }
    else {
      phase.value = 'idle'
    }
  }

  async function logoutAndReset() {
    clearRun()
    prefill.clear()
    pendingLogin.value = false
    phase.value = 'idle'
    await userStore.logout()
  }

  return {
    config,

    // Reactive state.
    phase,
    stepIndex,
    busy,
    pendingLogin,
    values,
    choices,
    fieldErrors,
    workflowSteps,
    animatedStepIndex,
    submissionId,
    inboxLetters,
    inboxLoading,
    inboxAttempts,
    outcomeLetter,
    outcomeReady,
    pollsInbox,
    workflowFailed,
    receiptRows,
    submittedAt,
    error,

    // Prefill.
    prefillData: prefill.data,
    prefillLoading: prefill.loading,
    prefillError: prefill.error,
    prefillAlert,
    rows,
    notAsked,
    missingChoices,
    chosenOptions,

    // Auth.
    user,
    sessionId,
    isAuthenticated,
    authLoading: computed(() => userStore.loading),

    // Actions.
    startLogin,
    syncFromAuth,
    loadPrefill,
    goPrefill,
    goToStep,
    continueToForm,
    validate,
    clearFieldError,
    submit,
    refreshInbox,
    reset,
    logoutAndReset,
  }
}
