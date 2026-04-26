import type { User } from '~/types/user'
import { useUserStore } from '~/stores/user'

/**
 * Orchestrates the interactive Byggetilladelse demo.
 *
 * Phases progress on real backend signals (callback session, submit response,
 * inbox poll). The only fakery is the 600-700ms reveal pause between
 * `workflow-running` and `fetching-letter` so the workflow tracker has time
 * to animate visibly before we slide to the inbox - the workflow steps
 * themselves were executed synchronously inside the submit POST.
 */

export type ByggetilladelsePhase =
  | 'idle'
  | 'callback-loading'
  | 'prefilled-form'
  | 'submitting'
  | 'workflow-running'
  | 'fetching-letter'
  | 'complete'

export interface WorkflowStep {
  id: string
  name: string
  description?: string
  status: 'completed' | 'failed' | 'skipped'
  error?: string | null
  completed_at?: string
}

export interface DigitalPostLetter {
  transaction_id: string
  subject: string
  body_html: string
  status: string
  created: number
  created_iso: string
}

interface SubmissionResponse {
  data?: { id?: string | number }
  workflow?: {
    status?: string
    step_count?: number
    steps?: WorkflowStep[]
  }
  message?: string
  errors?: Record<string, string>
}

interface InboxResponse {
  data?: DigitalPostLetter[]
}

const INBOX_POLL_DELAYS_MS = [600, 1200, 2000]

export const useByggetilladelseDemo = () => {
  const { apiBase } = useRuntimeConfig().public
  const { user, sessionId, isAuthenticated, login } = useAuth()
  const userStore = useUserStore()

  const phase = ref<ByggetilladelsePhase>('idle')
  const projectDescription = ref('')
  const addressOverride = ref<string | null>(null)
  const editingAddress = ref(false)

  const workflowSteps = ref<WorkflowStep[]>([])
  const animatedStepIndex = ref(-1)
  const submissionId = ref('')

  const inboxLetters = ref<DigitalPostLetter[]>([])
  const inboxLoading = ref(false)
  const inboxAttempts = ref(0)

  const error = ref<string | null>(null)

  /** Address from MitID claims, formatted as one line. */
  const prefilledAddress = computed<string>(() => {
    const a = user.value?.address
    if (!a) return ''
    const line1 = a.street ?? ''
    const line2 = [a.postal_code, a.city].filter(Boolean).join(' ')
    return [line1, line2].filter(Boolean).join(', ')
  })

  const effectiveAddress = computed<string>(() =>
    addressOverride.value !== null ? addressOverride.value : prefilledAddress.value,
  )

  /** True when MitID gave us address claims (mock IdP). */
  const addressIsPrefilled = computed<boolean>(() => prefilledAddress.value.length > 0)

  /** Used for the prefilled "Auto-udfyldt fra MitID" pill on name + cpr. */
  const identityIsPrefilled = computed<boolean>(() => isAuthenticated.value)

  function syncFromAuth() {
    // Called on mount and when the user store hydrates from session storage.
    if (!isAuthenticated.value) return
    if (phase.value === 'idle' || phase.value === 'callback-loading') {
      phase.value = 'prefilled-form'
    }
  }

  function kickoff() {
    phase.value = 'callback-loading'
    error.value = null
    // Drupal redirects back to /auth/callback?session=..., which then
    // navigates back here. Returning user lands at phase 'prefilled-form'
    // via syncFromAuth().
    login('/demo/byggetilladelse')
  }

  function reset() {
    phase.value = isAuthenticated.value ? 'prefilled-form' : 'idle'
    projectDescription.value = ''
    addressOverride.value = null
    editingAddress.value = false
    workflowSteps.value = []
    animatedStepIndex.value = -1
    submissionId.value = ''
    inboxLetters.value = []
    inboxAttempts.value = 0
    error.value = null
  }

  function logoutAndReset() {
    userStore.logout()
    reset()
    phase.value = 'idle'
  }

  function startOverride() {
    if (addressOverride.value === null) addressOverride.value = prefilledAddress.value
    editingAddress.value = true
  }

  function lockAddress() {
    addressOverride.value = null
    editingAddress.value = false
  }

  async function submit(): Promise<void> {
    if (!isAuthenticated.value || !user.value) {
      error.value = 'Not authenticated'
      return
    }
    if (!projectDescription.value.trim()) {
      error.value = 'validation'
      return
    }
    error.value = null
    phase.value = 'submitting'

    const u = user.value as User
    const body = {
      data: {
        attributes: {
          data: {
            cpr: u.cpr,
            applicant_name: u.name,
            property_address: effectiveAddress.value,
            project_description: projectDescription.value.trim(),
          },
        },
      },
    }

    try {
      const res = await $fetch<SubmissionResponse>(
        `${apiBase}/api/webform/building_permit/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body,
        },
      )

      workflowSteps.value = res.workflow?.steps ?? []
      submissionId.value = String(res.data?.id ?? '')

      phase.value = 'workflow-running'
      animatedStepIndex.value = -1
      await animateSteps()

      phase.value = 'fetching-letter'
      await pollInbox()
      phase.value = 'complete'
    }
    catch (e: any) {
      const msg = e?.data?.message || e?.message || 'submit_failed'
      error.value = msg
      phase.value = 'prefilled-form'
    }
  }

  async function animateSteps(): Promise<void> {
    // Reveal steps one at a time so the user sees the chain run. Each step
    // already executed server-side - this is purely visual pacing.
    for (let i = 0; i < workflowSteps.value.length; i++) {
      animatedStepIndex.value = i
      await new Promise((r) => setTimeout(r, 550))
    }
  }

  async function pollInbox(): Promise<void> {
    inboxAttempts.value = 0
    for (const delay of INBOX_POLL_DELAYS_MS) {
      await new Promise((r) => setTimeout(r, delay))
      await refreshInbox()
      inboxAttempts.value++
      if (inboxLetters.value.length > 0) return
    }
  }

  async function refreshInbox(): Promise<void> {
    if (!sessionId.value) return
    inboxLoading.value = true
    try {
      const res = await $fetch<InboxResponse>(
        `${apiBase}/api/digital-post/recent?session=${encodeURIComponent(
          sessionId.value,
        )}&limit=5`,
        { headers: { Accept: 'application/json' } },
      )
      inboxLetters.value = res.data ?? []
    }
    catch (e: any) {
      // Don't surface inbox errors as primary error; the empty-state UI
      // handles "no letters yet" gracefully.
      console.error('Inbox fetch failed:', e)
    }
    finally {
      inboxLoading.value = false
    }
  }

  return {
    // Reactive state.
    phase,
    projectDescription,
    addressOverride,
    editingAddress,
    workflowSteps,
    animatedStepIndex,
    submissionId,
    inboxLetters,
    inboxLoading,
    inboxAttempts,
    error,

    // Derived.
    user,
    sessionId,
    isAuthenticated,
    prefilledAddress,
    effectiveAddress,
    addressIsPrefilled,
    identityIsPrefilled,

    // Actions.
    kickoff,
    syncFromAuth,
    reset,
    logoutAndReset,
    startOverride,
    lockAddress,
    submit,
    refreshInbox,
  }
}
