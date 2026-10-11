<template>
  <div class="demo-wizard" :data-phase="phase">
    <FdsStepIndicator :steps="steps" @select="goToStep" />

    <div class="row mt-6">
      <!-- Main column: the current step. -->
      <div class="col-12 col-lg-8 demo-wizard__main">
        <FdsErrorSummary :errors="summaryErrors" />

        <FdsAlert
          v-if="errorAlert"
          type="error"
          :heading="errorAlert.heading"
          :text="errorAlert.text"
          class="mb-5"
        />

        <!-- Step 1: Log ind med MitID -->
        <section v-if="stepIndex === 0" key="login" aria-labelledby="demo-step-login">
          <h2 id="demo-step-login">{{ stepTitle('login') }}</h2>
          <p>{{ $t(config.loginBodyKey || 'demo.wizard.login.body') }}</p>


          <div v-if="autoLoggingOut" class="demo-wizard__loading" role="status" data-testid="demo-auto-logout">
            <span class="spinner spinner-small" aria-hidden="true" />
            {{ $t('demo.wizard.login.switchingPersona', { name: config.persona.name }) }}
          </div>

          <div v-else-if="authLoading || (pendingLogin && !isAuthenticated && !authSettled && !redirecting)" class="demo-wizard__loading" role="status">
            <span class="spinner spinner-small" aria-hidden="true" />
            {{ $t('demo.byggetilladelse.auth.callbackProcessing') }}
          </div>

          <template v-else-if="!isAuthenticated">
            <!-- One click per scenario: the button suggests the persona's
                 username to the mock MitID (login_hint); the password is
                 still typed there. -->
            <DemoPersonaLogin
              :name="config.persona.name"
              :story="$t(config.storyKey)"
              :password="config.persona.password"
              :disabled="redirecting"
              @login="onLoginClick"
            />
            <p class="demo-wizard__runtime mt-3">{{ $t('demo.byggetilladelse.kickoff.runtime') }}</p>
          </template>

          <template v-else>
            <p>
              {{ $t('demo.wizard.login.loggedInAs', { name: user?.name || '' }) }}
              <template v-if="user?.assurance_level">
                ({{ $t('demo.byggetilladelse.assurance.label') }}: {{ assuranceLabel(user.assurance_level) }})
              </template>
            </p>
            <div class="button-group">
              <FdsButton variant="primary" @click="goPrefill">{{ $t('demo.wizard.continue') }}</FdsButton>
              <FdsButton variant="tertiary" @click="logoutAndReset">{{ $t('demo.byggetilladelse.form.logout') }}</FdsButton>
            </div>
          </template>
        </section>

        <!-- Step 2: Hentede oplysninger -->
        <section v-else-if="stepIndex === 1" key="prefill" aria-labelledby="demo-step-prefill">
          <h2 id="demo-step-prefill">{{ $t('demo.wizard.prefill.heading') }}</h2>
          <FdsAlert
            v-if="prefillAlert"
            :type="prefillAlert.type"
            :text="$t(prefillAlert.textKey, prefillAlert.textParams ?? {})"
            class="mb-5"
            data-testid="demo-prefill-alert"
          />
          <FdsAlert
            v-if="personaMismatch"
            type="warning"
            :heading="$t('demo.wizard.persona.mismatchHeading', { name: user?.name })"
            heading-level="h3"
            class="mb-5"
            data-testid="demo-persona-mismatch"
          >
            <p class="mb-3">{{ $t('demo.wizard.persona.mismatchBody', { persona: config.persona.name, username: config.persona.username }) }}</p>
            <!-- Back to step 1, whose login button forces a fresh MitID sign-in. -->
            <FdsButton variant="secondary" @click="logoutAndReset">{{ $t('demo.wizard.persona.switch', { persona: config.persona.name }) }}</FdsButton>
          </FdsAlert>
          <p>{{ $t('demo.wizard.prefill.body') }}</p>

          <DemoProvenancePanel
            v-if="!actingForMissing"
            :rows="rows"
            :typed-labels="typedLabels"
            :choices="choices"
            :loading="prefillLoading"
            @update:choices="setChoices"
          />

          <div class="button-group mt-6">
            <FdsButton
              variant="primary"
              :disabled="prefillLoading || !prefillData || missingChoices.length > 0 || actingForMissing"
              @click="continueToForm"
            >
              {{ $t('demo.wizard.continue') }}
            </FdsButton>
            <FdsButton variant="secondary" :disabled="prefillLoading" @click="loadPrefill">
              {{ $t('demo.wizard.prefill.reload') }}
            </FdsButton>
          </div>
          <p v-if="missingChoices.length > 0 && !prefillLoading && !actingForMissing" class="demo-wizard__hint mt-3">
            {{ $t('demo.wizard.prefill.chooseFirst') }}
          </p>
        </section>

        <!-- Step 3: Det kun du ved -->
        <section v-else-if="stepIndex === 2" key="form" aria-labelledby="demo-step-form">
          <h2 id="demo-step-form">{{ $t('demo.wizard.form.heading') }}</h2>
          <p>{{ $t(config.formBodyKey || 'demo.wizard.form.body') }}</p>

          <dl v-if="summaryRows.length" class="demo-wizard__summary">
            <template v-for="row in summaryRows" :key="row.key">
              <dt>{{ row.label }}</dt>
              <dd>
                {{ row.display || '-' }}
                <span class="demo-wizard__summary-source">{{ $t('demo.wizard.form.fromRegister', { register: row.source.register }) }}</span>
              </dd>
            </template>
          </dl>

          <form novalidate @submit.prevent="submit">
            <FdsInput
              v-for="row in editableRows"
              :id="fieldId(row.formKey)"
              :key="row.formKey"
              :model-value="values[row.formKey] ?? ''"
              :label="row.label"
              :hint="editHint(row)"
              :error="fieldErrors[row.formKey]"
              width="xl"
              @update:model-value="(v) => setValue(row.formKey, v)"
            />

            <template v-for="field in config.form" :key="field.key">
              <FdsTextarea
                v-if="field.type === 'textarea'"
                :id="fieldId(field.key)"
                :model-value="values[field.key] ?? ''"
                :label="$t(field.labelKey)"
                :hint="field.hintKey ? $t(field.hintKey) : undefined"
                :placeholder="field.placeholderKey ? $t(field.placeholderKey) : undefined"
                :error="fieldErrors[field.key]"
                :rows="field.rows ?? 4"
                :width="field.width ?? 'xl'"
                :required="field.required"
                @update:model-value="(v) => setValue(field.key, v)"
              />
              <FdsSelect
                v-else-if="field.type === 'select'"
                :id="fieldId(field.key)"
                :model-value="values[field.key] ?? ''"
                :label="$t(field.labelKey)"
                :hint="field.hintKey ? $t(field.hintKey) : undefined"
                :options="(field.options || []).map((o) => ({ value: o.value, label: $t(o.labelKey) }))"
                :error="fieldErrors[field.key]"
                :width="field.width ?? 'm'"
                :required="field.required"
                @update:model-value="(v) => setValue(field.key, String(v))"
              />
              <FdsRadioGroup
                v-else-if="field.type === 'radio'"
                :id="fieldId(field.key)"
                :model-value="values[field.key] ?? null"
                :legend="$t(field.labelKey)"
                :hint="field.hintKey ? $t(field.hintKey) : undefined"
                :options="(field.options || []).map((o) => ({ value: o.value, label: $t(o.labelKey) }))"
                :error="fieldErrors[field.key]"
                :required="field.required"
                @update:model-value="(v) => setValue(field.key, String(v))"
              />
              <FdsInput
                v-else
                :id="fieldId(field.key)"
                :model-value="values[field.key] ?? ''"
                :label="$t(field.labelKey)"
                :hint="field.hintKey ? $t(field.hintKey) : undefined"
                :placeholder="field.placeholderKey ? $t(field.placeholderKey) : undefined"
                :error="fieldErrors[field.key]"
                :type="field.type === 'number' ? 'text' : field.type"
                :inputmode="field.inputmode ?? (field.type === 'number' ? 'numeric' : undefined)"
                :width="field.width ?? (field.type === 'number' ? 's' : 'l')"
                :required="field.required"
                @update:model-value="(v) => setValue(field.key, v)"
              />
            </template>

            <div class="button-group mt-6">
              <FdsButton type="submit" variant="primary" :disabled="phase === 'submitting'">
                {{ phase === 'submitting' ? $t('demo.byggetilladelse.form.submitting') : $t('demo.byggetilladelse.form.submit') }}
              </FdsButton>
              <FdsButton variant="tertiary" :disabled="phase === 'submitting'" @click="goToStep(1)">
                {{ $t('demo.wizard.back') }}
              </FdsButton>
            </div>
          </form>
        </section>

        <!-- Step 4: Sagsbehandling -->
        <section v-else-if="stepIndex === 3" key="workflow" aria-labelledby="demo-step-workflow" aria-live="polite">
          <h2 id="demo-step-workflow">{{ $t('demo.wizard.workflow.heading') }}</h2>
          <p>{{ $t('demo.byggetilladelse.workflow.body') }}</p>

          <ol v-if="workflowSteps.length > 0" class="nobullet-list demo-wizard__steps">
            <li
              v-for="(step, idx) in workflowSteps"
              :key="step.id"
              :class="['demo-wizard__step', workflowStepClass(idx, step)]"
            >
              <span class="demo-wizard__step-icon" aria-hidden="true">
                <svg v-if="idx < animatedStepIndex || (idx === animatedStepIndex && step.status === 'completed')" class="icon-svg"><use href="#check" /></svg>
                <span v-else-if="idx === animatedStepIndex" class="spinner spinner-small" />
                <span v-else class="demo-wizard__step-number">{{ idx + 1 }}</span>
              </span>
              <span class="demo-wizard__step-body">
                <strong>{{ step.name }}</strong>
                <span v-if="step.description" class="demo-wizard__step-desc">{{ step.description }}</span>
                <span v-if="step.error" class="demo-wizard__step-error">{{ step.error }}</span>
              </span>
            </li>
          </ol>
          <p v-else>{{ $t('demo.byggetilladelse.workflow.noSteps') }}</p>
        </section>

        <!-- Step 5: Digital Post -->
        <section v-else key="letter" aria-labelledby="demo-step-letter">
          <h2 id="demo-step-letter">{{ $t('demo.wizard.letter.heading') }}</h2>

          <template v-if="phase === 'complete' && outcomeReady">
            <FdsAlert
              :type="config.outcome.type ?? 'success'"
              role="status"
              :heading="$t(config.outcome.headingKey)"
              :text="$t(config.outcome.bodyKey)"
              class="mb-5"
            />
            <dl v-if="receiptRows.length" class="demo-wizard__summary demo-wizard__receipt" data-testid="demo-receipt">
              <template v-for="row in receiptRows" :key="row.labelKey">
                <dt>{{ $t(row.labelKey) }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
            <FdsAlert
              v-if="config.outcome.letterRecipient === 'other' && config.outcome.recipientAlert"
              type="info"
              :heading="$t(config.outcome.recipientAlert.headingKey)"
              :text="$t(config.outcome.recipientAlert.bodyKey)"
              class="mb-5"
            />
          </template>
          <FdsAlert
            v-else-if="phase === 'complete' && workflowFailed"
            type="warning"
            :heading="$t('demo.wizard.letter.failedHeading')"
            :text="$t('demo.wizard.letter.failedBody')"
            class="mb-5"
          />
          <FdsAlert
            v-else-if="phase === 'complete'"
            type="warning"
            :heading="$t('demo.wizard.letter.noLetterHeading')"
            :text="$t('demo.wizard.letter.noLetterBody')"
            class="mb-5"
          />
          <p v-else class="demo-wizard__loading" role="status">
            <span class="spinner spinner-small" aria-hidden="true" />
            {{ $t('demo.byggetilladelse.inbox.body') }}
          </p>

          <DemoDigitalPostInbox
            :letters="inboxLetters"
            :loading="inboxLoading"
            :since="submittedAt || undefined"
            @refresh="refreshInbox"
          />

          <!-- Page-specific follow-up (e.g. the co-signer hand-over), inside the main column. -->
          <div v-if="phase === 'complete' && $slots.afterOutcome" class="demo-wizard__after mt-8">
            <slot name="afterOutcome" />
          </div>

          <template v-if="phase === 'complete'">
            <div class="button-group mt-6">
              <FdsButton variant="primary" @click="reset">{{ $t('demo.byggetilladelse.complete.runAgain') }}</FdsButton>
              <NuxtLink :to="localePath({ path: '/demo' })" class="button button-secondary">{{ $t('demo.hub.allDemos') }}</NuxtLink>
            </div>

            <div ref="contactCtaRef" class="demo-wizard__cta mt-8">
              <p class="demo-wizard__cta-eyebrow">{{ $t('demo.byggetilladelse.contactCta.eyebrow') }}</p>
              <h3 class="h3">{{ $t('demo.byggetilladelse.contactCta.heading') }}</h3>
              <p>{{ $t('demo.byggetilladelse.contactCta.body') }}</p>
              <NuxtLink :to="localePath({ path: '/kontakt' })" class="button button-secondary">
                {{ $t('demo.byggetilladelse.contactCta.primary') }}
              </NuxtLink>
            </div>
          </template>
        </section>
      </div>

      <!-- Aside: behind the scenes. -->
      <aside class="col-12 col-lg-4 demo-wizard__aside" :aria-label="$t('demo.byggetilladelse.commentary.title')">
        <div class="demo-wizard__commentary">
          <h2 class="h5">{{ $t('demo.byggetilladelse.commentary.title') }}</h2>
          <p>{{ commentary }}</p>
        </div>
        <DemoMockIdPBanner class="mt-5" />
        <DemoCapabilityBadgeRow class="mt-5" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
// The guided scenario shell: DKFDS Trinindikator with the five steps, the
// current step in the main column, "Hvad sker der bag kulisserne" + the
// mock-IdP notice + capability tags in the aside. One primary button per view.
import type { FdsStep } from '~/components/fds/FdsStepIndicator.vue'
import type { FdsErrorSummaryItem } from '~/components/fds/FdsErrorSummary.vue'
import type { DemoProvenanceRow, DemoScenarioConfig, DemoStepId, WorkflowStep } from '~/types/demo'
import { DEMO_STEP_IDS } from '~/types/demo'

const props = defineProps<{
  config: DemoScenarioConfig
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { login } = useAuth()

const {
  config,
  phase,
  stepIndex,
  busy,
  pendingLogin,
  values,
  choices,
  fieldErrors,
  workflowSteps,
  animatedStepIndex,
  inboxLetters,
  inboxLoading,
  outcomeLetter,
  outcomeReady,
  workflowFailed,
  receiptRows,
  submittedAt,
  error,
  prefillData,
  prefillLoading,
  prefillAlert,
  rows,
  notAsked,
  missingChoices,
  actingForMissing,
  user,
  isAuthenticated,
  authLoading,
  startLogin,
  syncFromAuth,
  loadPrefill,
  goPrefill,
  goToStep,
  continueToForm,
  clearFieldError,
  submit,
  refreshInbox,
  reset,
  logoutAndReset,
} = useDemoScenario(props.config)

// --- step indicator ------------------------------------------------------

function stepTitle(id: DemoStepId): string {
  const override = config.steps?.[id]?.titleKey
  return t(override || `demo.wizard.steps.${id}`)
}

const steps = computed<FdsStep[]>(() =>
  DEMO_STEP_IDS.map((id, i) => {
    const hintKey = config.steps?.[id]?.hintKey
    return {
      title: stepTitle(id),
      hint: hintKey ? t(hintKey) : undefined,
      state: i < stepIndex.value ? 'completed' : i === stepIndex.value ? 'current' : 'upcoming',
    }
  }),
)

// --- form helpers --------------------------------------------------------

const fieldId = (key: string) => `demo-${config.id}-${key}`

const editableRows = computed(() => rows.value.filter((r) => r.editable))
const summaryRows = computed(() => rows.value.filter((r) => !r.editable))

function editHint(row: DemoProvenanceRow): string {
  const entry = config.prefillMap.find((e) => e.key === row.key)
  if (entry?.editHintKey) return t(entry.editHintKey)
  return t('demo.wizard.form.editHint', { register: row.source.register })
}

function setChoices(v: Record<string, string>) {
  choices.value = v
}

function setValue(key: string, v: string | number) {
  values.value[key] = String(v)
  clearFieldError(key)
}

const summaryErrors = computed<FdsErrorSummaryItem[]>(() =>
  Object.entries(fieldErrors.value).map(([key, message]) => ({ id: fieldId(key), message })),
)

/** Labels for "Det kun du ved": config fields first, unknown keys verbatim. */
const typedLabels = computed<string[]>(() => {
  const known = new Map(config.form.map((f) => [f.key, t(f.labelKey)]))
  const keys = notAsked.value.length ? notAsked.value : config.form.map((f) => f.key)
  const labels = keys.map((k) => known.get(k) ?? k)
  for (const [key, label] of known) {
    if (!keys.includes(key)) labels.push(label)
  }
  return labels
})

// --- errors ----------------------------------------------------------------

const errorAlert = computed(() => {
  const e = error.value
  if (!e) return null
  const known: Record<string, string> = {
    session_expired: 'demo.wizard.errors.sessionExpired',
    not_authenticated: 'demo.wizard.errors.sessionExpired',
    prefill_failed: 'demo.wizard.errors.prefillFailed',
    form_not_found: 'demo.wizard.errors.formNotFound',
    submit_failed: 'demo.wizard.errors.submitFailed',
  }
  return {
    heading: t('demo.wizard.errors.heading'),
    text: known[e] ? t(known[e]) : e,
  }
})

// --- workflow list ---------------------------------------------------------

function workflowStepClass(idx: number, step: WorkflowStep): string {
  if (idx < animatedStepIndex.value || (idx === animatedStepIndex.value && step.status === 'completed')) return 'is-done'
  if (idx === animatedStepIndex.value) return 'is-running'
  return 'is-upcoming'
}

// --- commentary ------------------------------------------------------------

const commentary = computed(() => {
  const id = DEMO_STEP_IDS[stepIndex.value] ?? 'login'
  const key = config.commentaryKeys?.[id] ?? `demo.wizard.commentary.${id}`
  return t(key)
})

function assuranceLabel(acr: string): string {
  if (acr.endsWith('high')) return t('demo.byggetilladelse.assurance.high')
  if (acr.endsWith('substantial')) return t('demo.byggetilladelse.assurance.substantial')
  if (acr.endsWith('low')) return t('demo.byggetilladelse.assurance.low')
  return acr
}

// --- lifecycle ---------------------------------------------------------------

// After the MitID round-trip the store restores from sessionStorage (async). Until
// that settles we show "Henter dine MitID-data"; afterwards a cancelled login
// falls back to the button.
const authSettled = ref(false)
// Set when the MitID button was pressed in this page life, so the button stays
// mounted while the browser navigates away (the spinner is for the return trip).
const redirecting = ref(false)

function onLoginClick() {
  redirecting.value = true
  startLogin()
  login(window.location.pathname, { fresh: true, loginHint: props.config.persona.username })
}

const contactCtaRef = ref<HTMLElement | null>(null)

function settleAuth() {
  if (authSettled.value) return
  authSettled.value = true
  // Conclusive now: a restored phase without a session falls back to step 1.
  syncFromAuth()
}

onMounted(() => {
  syncFromAuth(true)
  // Give restoreSession() a moment; it flips `loading` synchronously when a
  // stored session exists, otherwise there is nothing to wait for.
  setTimeout(settleAuth, 1500)
})

watch(isAuthenticated, () => syncFromAuth())

/** The data on step 2 always belongs to the logged-in person; warn when that is not the scenario's persona. */
const personaMismatch = computed(() =>
  Boolean(isAuthenticated.value && user.value?.name && user.value.name !== props.config.persona.name),
)
watch(authLoading, (loading) => { if (!loading) settleAuth() })

// Someone else is already signed in when the page loads (e.g. the previous
// demo's persona): end that session fully (revoke + IdP logout, back to this
// page) so the scenario starts from its own persona. Not when the person just
// came back from a login they chose here - then the step 2 warning explains
// the mismatch. The warning is also the fallback if the logout fails.
const cameFromLogin = ref(false)
watch(pendingLogin, (v) => { if (v) cameFromLogin.value = true }, { immediate: true, flush: 'sync' })
const autoLogoutTried = ref(false)
const autoLoggingOut = ref(false)
watch([personaMismatch, authSettled], async ([mismatch, settled]) => {
  if (!mismatch || !settled || autoLogoutTried.value || cameFromLogin.value || redirecting.value) return
  autoLogoutTried.value = true
  autoLoggingOut.value = true
  try {
    await logoutAndReset()
  }
  catch {
    autoLoggingOut.value = false
  }
})

// Move focus to the step heading on each step change so keyboard and screen
// reader users land on the new content; scroll the contact CTA in on complete.
watch(stepIndex, async () => {
  await nextTick()
  const h = document.querySelector<HTMLElement>('.demo-wizard__main section h2')
  if (h && !busy.value) {
    h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: false })
  }
})

watch(phase, async (next) => {
  if (next === 'complete') {
    await nextTick()
    contactCtaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>

<style scoped>
/* Our own CSS is authored against the 16px root (DKFDS rem values are rebased). */
.demo-wizard__runtime,
.demo-wizard__hint {
  color: #5c5c5c;
  font-size: 0.9375rem;
}

.demo-wizard__loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.demo-wizard__summary {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0 0 1.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  background: #f5f5f5;
}

.demo-wizard__summary dt {
  font-weight: 600;
}

.demo-wizard__summary dd {
  margin: 0;
}

.demo-wizard__receipt {
  background: #fff;
}

.demo-wizard__summary-source {
  display: block;
  color: #5c5c5c;
  font-size: 0.8125rem;
}

@media (max-width: 575px) {
  .demo-wizard__summary {
    grid-template-columns: 1fr;
  }
}

.demo-wizard__steps {
  margin: 0;
}

.demo-wizard__step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  margin-top: 0.5rem;
  transition: background-color 300ms ease, border-color 300ms ease;
}

.demo-wizard__step.is-done {
  border-color: #358000;
  background: #eef7e8;
}

.demo-wizard__step.is-running {
  border-color: #1a5a96;
  background: #e8f1fa;
}

.demo-wizard__step.is-upcoming {
  opacity: 0.6;
}

.demo-wizard__step-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #dcdcdc;
  color: #1a1a1a;
}

.demo-wizard__step.is-done .demo-wizard__step-icon {
  background: #358000;
  color: #fff;
}

.demo-wizard__step.is-done .demo-wizard__step-icon .icon-svg {
  fill: #fff;
}

.demo-wizard__step.is-running .demo-wizard__step-icon {
  background: transparent;
}

.demo-wizard__step-number {
  font-size: 0.875rem;
  font-weight: 600;
}

.demo-wizard__step-body {
  display: flex;
  flex-direction: column;
}

.demo-wizard__step-desc {
  color: #454545;
  font-size: 0.9375rem;
}

.demo-wizard__step-error {
  color: #cc0000;
  font-size: 0.9375rem;
}

.demo-wizard__cta {
  border: 1px solid #dcdcdc;
  border-left: 4px solid #1a5a96;
  border-radius: 4px;
  padding: 1.5rem;
  background: #f5f5f5;
}

.demo-wizard__cta-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  font-weight: 700;
  color: #454545;
  margin-bottom: 0.5rem;
}

.demo-wizard__commentary {
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  padding: 1.25rem;
  background: #f5f5f5;
}

.demo-wizard__commentary p {
  margin: 0;
  font-size: 0.9375rem;
}

@media (min-width: 992px) {
  .demo-wizard__aside {
    position: sticky;
    top: 1.5rem;
    align-self: flex-start;
  }
}
</style>
