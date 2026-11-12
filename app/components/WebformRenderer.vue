<template>
  <form
    @submit.prevent="onFormSubmit"
    class="webform-renderer"
    :aria-label="schema?.title || 'Form'"
    novalidate
  >
    <!-- Persistent live region: announces the receipt and step changes. -->
    <div class="sr-only" aria-live="polite" aria-atomic="true">{{ liveMessage }}</div>

    <div
      v-if="loading"
      class="loading"
      role="status"
      aria-live="polite"
    >
      <p>{{ $t('form.loading') }}</p>
    </div>

    <div
      v-else-if="error"
      class="error"
      role="alert"
      aria-live="assertive"
    >
      <FdsAlert type="error" :heading="$t('form.loadError')" :text="error" class="mb-5" />
      <FdsButton type="button" variant="secondary" class="retry-button" @click="loadForm">
        {{ $t('form.retry') }}
      </FdsButton>
    </div>

    <!-- MitID gate: the flow behind this form validates identity, so demand a
         session before showing the fields at all. -->
    <div v-else-if="mitidGateActive" class="mitid-gate" role="region" :aria-label="$t('auth.loginRequired')">
      <p class="mitid-gate-text">{{ $t('form.mitidRequired') }}</p>
      <FdsButton type="button" class="mitid-login-button" @click="startMitidLogin">
        {{ $t('auth.loginWithMitId') }}
      </FdsButton>
    </div>

    <!-- Kvittering: replaces the form once the submission is accepted. -->
    <div v-else-if="receipt && schema" ref="receiptWrap" class="webform-receipt-wrap" tabindex="-1">
      <h1 v-if="schema.title">{{ schema.title }}</h1>
      <WebformReceipt
        :form-title="schema.title"
        :submitted-at="receipt.submittedAt"
        :reference="receipt.reference"
        :rows="receipt.rows"
        :next-steps-html="nextStepsHtml"
        :expected-response="gedisa.expected_response"
        :recipient="gedisa.recipient"
      />
    </div>

    <div v-else-if="schema" class="form-fields">
      <h1 v-if="schema.title">{{ schema.title }}</h1>
      <div v-if="schema.requires_mitid && isAuthenticated" class="mitid-session-banner" role="status">
        <FdsAlert type="info" paragraph>
          {{ $t('form.mitidLoggedInAs') }} <strong>{{ user?.name }}</strong>
        </FdsAlert>
      </div>

      <!-- Intro (what it is about, have ready, legal basis, recipient) before step 1 -->
      <WebformIntro v-if="currentIndex === 0" :gedisa="gedisa" :description="schema.description" />

      <FdsStepIndicator
        v-if="steps.length > 1"
        :steps="indicatorSteps"
        class="webform-steps"
        @select="onIndicatorSelect"
      />

      <FdsErrorSummary :errors="summaryErrors" :heading="$t('form.stepErrorsHeading')" />

      <section
        v-if="currentStep"
        class="webform-step"
        :class="`webform-step--${webformCssSafe(currentStep.key)}`"
        :aria-labelledby="stepHeadingId"
      >
        <h2 :id="stepHeadingId" ref="stepHeading" tabindex="-1" class="webform-step__heading">
          <span v-if="steps.length > 1" class="webform-step__count">{{ $t('form.stepOf', { n: currentIndex + 1, total: steps.length }) }}</span>
          {{ currentStep.title }}
        </h2>
        <p v-if="currentStep.description" class="webform-step__description">{{ currentStep.description }}</p>

        <!-- Opsummering: the answers so far, each with a Redigér link -->
        <div v-if="currentStep.showsSummary" class="webform-step__summary">
          <p class="webform-step__summary-lead">{{ $t('form.summaryLead') }}</p>
          <WebformSummary :rows="summaryRows" @edit="editField" />
        </div>

        <WebformField
          v-for="key in visibleStepKeys"
          :key="key"
          :element="elements[key]"
          :field-key="key"
          :model-value="formData[key]"
          :address-model="addressModels[key] || null"
          :error="fieldErrors[key]"
          :required="isElementRequired(elements[key], formData)"
          :optional="isMarkedOptional(key)"
          :required-label="isMarkedRequired(key)"
          @update:model-value="(v) => setValue(key, v)"
          @update:address-model="(v) => onAddressUpdate(key, v)"
        />

        <p v-if="stopActive" class="webform-stop-notice" role="status">
          {{ $t('form.stopBlocks') }}
        </p>
      </section>

      <!-- Server-side errors (not tied to a field) -->
      <div
        v-if="validationErrors.length > 0"
        id="form-errors"
        class="validation-errors"
        aria-live="assertive"
        aria-atomic="true"
      >
        <FdsAlert type="error" :heading="$t('form.validationErrors')">
          <ul class="nobullet-list">
            <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
          </ul>
        </FdsAlert>
      </div>

      <div class="form-actions">
        <FdsButton
          v-if="currentIndex > 0"
          type="button"
          variant="secondary"
          class="back-button"
          @click="goBack"
        >
          {{ $t('form.back') }}
        </FdsButton>
        <FdsButton
          v-if="!isLastStep"
          type="button"
          class="next-button"
          :disabled="stopActive"
          @click="goNext"
        >
          {{ $t('form.next') }}
        </FdsButton>
        <FdsButton
          v-else
          type="submit"
          :disabled="submitting || stopActive"
          class="submit-button"
          full-width-xs
        >
          {{ submitting ? $t('form.submitting') : (schema.settings?.submit_label || $t('form.submitApplication')) }}
        </FdsButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
// Generic webform wizard: loads GET /api/webform/{id}, renders its wizard
// pages as DKFDS steps (one step when the form has no pages), evaluates
// `#states`, validates per page, shows an opsummering with Redigér links,
// submits through the same-origin session route and ends in a kvittering.
import { useI18n } from 'vue-i18n'
import type { FdsErrorSummaryItem } from '~/components/fds/FdsErrorSummary.vue'
import type { FdsStep } from '~/components/fds/FdsStepIndicator.vue'
import WebformField, { type AddressModel } from '~/components/forms/WebformField.vue'
import WebformSummary, { type WebformSummaryRow } from '~/components/forms/WebformSummary.vue'
import WebformReceipt from '~/components/forms/WebformReceipt.vue'
import WebformIntro, { type WebformGedisa } from '~/components/forms/WebformIntro.vue'
import {
  isContainerElement,
  isMarkupElement,
  isElementVisible,
  isElementRequired,
  webformCssSafe,
  webformFieldId,
} from '~/composables/useWebformStates'

const props = defineProps<{
  webformId: string
}>()

const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user, login, restoreSession } = useAuth()

interface WizardStep {
  key: string
  title: string
  description?: string
  /** Keys of the renderable (non-container, non-hidden) elements on this page. */
  elements: string[]
  /** The summary list renders at the top of this step. */
  showsSummary: boolean
  /** An appended step with no elements of its own. */
  summaryOnly: boolean
}

interface Receipt {
  submittedAt: Date
  reference: string | null
  rows: WebformSummaryRow[]
}

// State
const loading = ref(true)
const error = ref<string | null>(null)
const schema = ref<any>(null)
const formData = ref<Record<string, any>>({})
const addressModels = ref<Record<string, AddressModel | null>>({})
const submitting = ref(false)
const success = ref(false)
const receipt = ref<Receipt | null>(null)
const validationErrors = ref<string[]>([])
// Per-field error messages keyed by element key. Bound to each field's :error
// so the DKFDS form-error state (aria-invalid + aria-describedby) lights up,
// and mirrored into the Fejlopsummering (summaryErrors) with the field ids.
const fieldErrors = ref<Record<string, string>>({})
const summaryErrors = ref<FdsErrorSummaryItem[]>([])
const liveMessage = ref('')

// Wizard position
const currentIndex = ref(0)
const maxReached = ref(0)
const errorSteps = ref<Set<number>>(new Set())
const stepHeading = ref<HTMLElement | null>(null)
const receiptWrap = ref<HTMLElement | null>(null)
const stepHeadingId = `${useId()}-step-heading`

const elements = computed<Record<string, any>>(() => schema.value?.elements || {})
const gedisa = computed<WebformGedisa>(() => schema.value?.gedisa || {})
const nextStepsHtml = computed<string | null>(() =>
  gedisa.value.next_steps || schema.value?.settings?.confirmation_message || null,
)

function isRenderable(key: string): boolean {
  const el = elements.value[key]
  return !!el && !isContainerElement(el) && el['#type'] !== 'hidden' && el['#access'] !== false
}

// Steps from `pages` (webform_wizard_page containers, in order); without
// pages every renderable element is one step. The opsummering is appended
// unless the form ends with its own `opsummering` page, which then carries
// the summary above its own elements (the erklæring checkbox).
const steps = computed<WizardStep[]>(() => {
  if (!schema.value) {
    return []
  }
  const pages: any[] = Array.isArray(schema.value.pages) ? schema.value.pages : []
  const list: WizardStep[] = []
  if (pages.length) {
    const placed = new Set<string>()
    for (const page of pages) {
      const keys = (Array.isArray(page.elements) ? page.elements : []).filter((k: string) => isRenderable(k))
      keys.forEach((k: string) => placed.add(k))
      list.push({
        key: String(page.key || `page-${list.length + 1}`),
        title: page.title || page.key,
        description: page.description || undefined,
        elements: keys,
        showsSummary: false,
        summaryOnly: false,
      })
    }
    // Elements outside every page belong to the first step.
    const orphans = Object.keys(elements.value).filter((k) => isRenderable(k) && !placed.has(k))
    if (orphans.length && list[0]) {
      list[0].elements = [...list[0].elements, ...orphans]
    }
  } else {
    list.push({
      key: 'ansoegning',
      title: t('form.singleStepTitle'),
      elements: Object.keys(elements.value).filter((k) => isRenderable(k)),
      showsSummary: false,
      summaryOnly: false,
    })
  }
  const last = list[list.length - 1]
  if (last && last.key === 'opsummering') {
    last.showsSummary = true
  } else {
    list.push({
      key: 'opsummering',
      title: t('form.summary'),
      elements: [],
      showsSummary: true,
      summaryOnly: true,
    })
  }
  return list
})

const currentStep = computed<WizardStep | undefined>(() => steps.value[currentIndex.value])
const isLastStep = computed(() => currentIndex.value >= steps.value.length - 1)

const visibleStepKeys = computed<string[]>(() =>
  (currentStep.value?.elements || []).filter((k) => isElementVisible(k, elements.value, formData.value)),
)

// A visible `stop` markup on the current step blocks Næste and the submit.
const stopActive = computed(() =>
  visibleStepKeys.value.some((k) => {
    const el = elements.value[k]
    const kind = el?.['#attributes']?.['data-aabenforms-alert']
    return isMarkupElement(el) && (kind === 'stop' || kind === 'error')
  }),
)

const indicatorSteps = computed<FdsStep[]>(() =>
  steps.value.map((step, i) => ({
    title: step.title,
    state: i === currentIndex.value
      ? 'current'
      : errorSteps.value.has(i)
        ? 'error'
        : i <= maxReached.value
          ? 'completed'
          : 'upcoming',
  })),
)

// DKFDS minority rule per step: when most fields are required, mark the
// optional ones "(frivilligt)"; when most are optional, mark the required.
const mostFieldsRequired = computed(() => {
  const keys = visibleStepKeys.value.filter((k) => !isMarkupElement(elements.value[k]))
  const required = keys.filter((k) => isElementRequired(elements.value[k], formData.value)).length
  return required * 2 >= keys.length
})
function isMarkedOptional(key: string): boolean {
  return mostFieldsRequired.value && !isElementRequired(elements.value[key], formData.value)
}
function isMarkedRequired(key: string): boolean {
  return !mostFieldsRequired.value && isElementRequired(elements.value[key], formData.value)
}

function setValue(key: string, value: any) {
  formData.value[key] = value
  // The inline error clears as soon as the citizen edits the field; the
  // Fejlopsummering keeps its list until the next validation so it does
  // not grab focus while typing.
  if (fieldErrors.value[key]) {
    delete fieldErrors.value[key]
  }
}

// Mirror a selected address into the flat keys the backend expects
// (`<key>_street`, `<key>_postal_code`, `<key>_city`, `<key>_id`).
function onAddressUpdate(key: string, value: AddressModel | null) {
  addressModels.value[key] = value
  if (value) {
    formData.value[key + '_street'] = value.street
    formData.value[key + '_postal_code'] = value.postal_code
    formData.value[key + '_city'] = value.city
    formData.value[key + '_id'] = value.id
  } else {
    delete formData.value[key + '_street']
    delete formData.value[key + '_postal_code']
    delete formData.value[key + '_city']
    delete formData.value[key + '_id']
  }
  if (fieldErrors.value[key]) {
    delete fieldErrors.value[key]
  }
}

// The identity gate is declared by the workflow (requires_mitid on the
// schema), not per page: no session means login instead of form fields.
const mitidGateActive = computed(() =>
  !!schema.value?.requires_mitid && !isAuthenticated.value
)

function startMitidLogin() {
  login(route.fullPath)
}

// A CPR is formatted DDMMYY-XXXX for display; sessions hold 10 bare digits.
function formatCpr(cpr: string): string {
  return /^\d{10}$/.test(cpr) ? `${cpr.slice(0, 6)}-${cpr.slice(6)}` : cpr
}

// Prefill the first CPR element from the MitID session ("Udfyldes automatisk
// fra MitID"), leaving anything the user already typed alone.
function prefillCprFromSession() {
  if (!schema.value?.requires_mitid || !user.value?.cpr) {
    return
  }
  for (const [key, field] of Object.entries<any>(schema.value.elements || {})) {
    if (field['#type'] === 'cpr' || field['#type'] === 'cpr_field') {
      if (!formData.value[key]) {
        formData.value[key] = formatCpr(user.value.cpr)
      }
      break
    }
  }
}

watch(isAuthenticated, () => prefillCprFromSession())

// Load form schema on mount (client-side only)
onMounted(async () => {
  if (process.client) {
    await restoreSession()
    loadForm()
  }
})

// Load webform schema from backend
async function loadForm() {
  loading.value = true
  error.value = null

  try {
    const config = useRuntimeConfig()

    // Use custom API endpoint instead of JSON:API (bypasses permissions)
    const response = await $fetch<any>(`${config.public.apiBase}/api/webform/${props.webformId}`, {
      method: 'GET'
    })

    // Check if we got a valid response
    if (!response.data || !response.data.attributes) {
      throw new Error(t('form.loadError'))
    }

    schema.value = response.data.attributes
    currentIndex.value = 0
    maxReached.value = 0
    errorSteps.value = new Set()

    // Hidden elements are not rendered, so seed their default values here.
    for (const [key, field] of Object.entries<any>(schema.value.elements || {})) {
      if (field['#type'] === 'hidden' && field['#default_value'] !== undefined) {
        formData.value[key] = field['#default_value']
      }
    }
    prefillCprFromSession()
    loading.value = false
  } catch (e: any) {
    console.error('Failed to load webform:', e)
    error.value = e.message || t('form.loadError')
    loading.value = false
  }
}

// Whether a field currently holds a value (address fields track a model).
function fieldHasValue(key: string, field: any): boolean {
  if (field['#type'] === 'address') {
    return !!addressModels.value[key]
  }
  const value = formData.value[key]
  if (field['#type'] === 'checkbox') {
    return value === true || value === 1 || value === '1'
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return value !== undefined && value !== null && String(value).trim() !== ''
}

// A format error for a filled field, or null. Basic checks only; the
// backend validates again.
function formatError(key: string, field: any): string | null {
  const value = String(formData.value[key] ?? '').trim()
  const label = field['#title'] || key
  switch (field['#type']) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : t('form.fieldInvalidEmail', { field: label })
    case 'number':
      return Number.isNaN(Number(value)) ? t('form.fieldInvalidNumber', { field: label }) : null
    case 'cpr':
    case 'cpr_field':
      return /^\d{6}-?\d{4}$/.test(value) ? null : t('form.fieldInvalidCpr', { field: label })
    default:
      return null
  }
}

// Client-side validation of one step. Hidden and `#states`-invisible
// elements are skipped. Error text names the field ("Byggeadresse skal
// udfyldes"), per WCAG 3.3.1; the summary takes focus itself so a
// keyboard/AT user lands on the list of what needs fixing (DKFDS pattern).
function validateStep(index: number): FdsErrorSummaryItem[] {
  const step = steps.value[index]
  const result: FdsErrorSummaryItem[] = []
  if (!step) {
    return result
  }
  for (const key of step.elements) {
    const field = elements.value[key]
    if (!field || isMarkupElement(field) || !isElementVisible(key, elements.value, formData.value)) {
      continue
    }
    const label = field['#title'] || key
    let message: string | null = null
    if (!fieldHasValue(key, field)) {
      if (isElementRequired(field, formData.value)) {
        message = t('form.fieldRequired', { field: label })
      }
    } else {
      message = formatError(key, field)
    }
    if (message) {
      result.push({ id: webformFieldId(key), message })
    }
  }
  return result
}

function applyErrors(index: number, items: FdsErrorSummaryItem[]) {
  const byKey: Record<string, string> = {}
  for (const item of items) {
    const key = steps.value[index]?.elements.find((k) => webformFieldId(k) === item.id)
    if (key) {
      byKey[key] = item.message
    }
  }
  fieldErrors.value = byKey
  summaryErrors.value = items
  const next = new Set(errorSteps.value)
  if (items.length) {
    next.add(index)
  } else {
    next.delete(index)
  }
  errorSteps.value = next
}

function clearErrors() {
  fieldErrors.value = {}
  summaryErrors.value = []
  validationErrors.value = []
}

// Moves to a step; focus lands on the step heading (or a named field, for
// Redigér) so keyboard and screen-reader users follow the change.
async function goToStep(index: number, focusKey?: string) {
  if (index < 0 || index >= steps.value.length) {
    return
  }
  currentIndex.value = index
  maxReached.value = Math.max(maxReached.value, index)
  await nextTick()
  if (focusKey) {
    const id = webformFieldId(focusKey)
    const target = document.getElementById(id) || document.getElementById(`${id}-option1`)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.focus({ preventScroll: true })
      return
    }
  }
  stepHeading.value?.focus()
  stepHeading.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goNext() {
  if (stopActive.value) {
    return
  }
  const items = validateStep(currentIndex.value)
  if (items.length) {
    applyErrors(currentIndex.value, items)
    return
  }
  applyErrors(currentIndex.value, [])
  goToStep(currentIndex.value + 1)
}

function goBack() {
  clearErrors()
  goToStep(currentIndex.value - 1)
}

function onIndicatorSelect(index: number) {
  if (index === currentIndex.value) {
    return
  }
  if (index < currentIndex.value) {
    clearErrors()
    goToStep(index)
    return
  }
  // Forward to a step already reached: the current step must still validate.
  const items = validateStep(currentIndex.value)
  if (items.length) {
    applyErrors(currentIndex.value, items)
    return
  }
  applyErrors(currentIndex.value, [])
  goToStep(index)
}

function editField(target: { page: number; key: string }) {
  clearErrors()
  goToStep(target.page, target.key)
}

// Enter in a text field submits the form; on a wizard page that means Næste.
function onFormSubmit() {
  if (isLastStep.value) {
    submitForm()
  } else {
    goNext()
  }
}

// The display value of an answer (option labels, Ja/Nej, formatted address).
function displayValue(key: string, field: any): { value: string; empty: boolean } {
  if (!fieldHasValue(key, field)) {
    return { value: t('form.notAnswered'), empty: true }
  }
  const raw = formData.value[key]
  const options: Record<string, string> = field['#options'] || {}
  switch (field['#type']) {
    case 'address': {
      const a = addressModels.value[key]
      return { value: a ? `${a.street}, ${a.postal_code} ${a.city}` : '', empty: !a }
    }
    case 'checkbox':
      return { value: t('form.yes'), empty: false }
    case 'radios':
    case 'select':
      return { value: Array.isArray(raw) ? raw.map((v) => options[v] ?? v).join(', ') : (options[String(raw)] ?? String(raw)), empty: false }
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw))
      return { value: m ? `${m[3]}.${m[2]}.${m[1]}` : String(raw), empty: false }
    }
    default:
      return { value: Array.isArray(raw) ? raw.join(', ') : String(raw), empty: false }
  }
}

// Rows for the opsummering: every visible, value-bearing element of every
// step except (by default) the step that shows the summary itself, whose
// elements sit right below it.
function buildSummaryRows(includeSummaryStep: boolean): WebformSummaryRow[] {
  const rows: WebformSummaryRow[] = []
  steps.value.forEach((step, page) => {
    if (step.showsSummary && !includeSummaryStep) {
      return
    }
    for (const key of step.elements) {
      const field = elements.value[key]
      if (!field || isMarkupElement(field) || !isElementVisible(key, elements.value, formData.value)) {
        continue
      }
      const shown = displayValue(key, field)
      rows.push({ key, label: field['#title'] || key, value: shown.value, page, empty: shown.empty })
    }
  })
  return rows
}

const summaryRows = computed(() => buildSummaryRows(false))

// The submitted data: hidden elements, every visible value-bearing element
// and the flat address keys of a visible address element. Invisible
// (`#states`) answers never leave the browser.
function buildPayload(): Record<string, any> {
  const out: Record<string, any> = {}
  const addressKeys = Object.keys(addressModels.value)
  for (const [key, value] of Object.entries(formData.value)) {
    const field = elements.value[key]
    if (field) {
      if (isContainerElement(field) || isMarkupElement(field)) {
        continue
      }
      if (field['#type'] !== 'hidden' && !isElementVisible(key, elements.value, formData.value)) {
        continue
      }
    } else {
      const base = addressKeys.find((b) => key.startsWith(`${b}_`))
      if (base && !isElementVisible(base, elements.value, formData.value)) {
        continue
      }
    }
    out[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value
  }
  return out
}

// Field errors from the backend (422 `errors: { key: message }`): shown on
// the fields and in the Fejlopsummering, on the step that holds the first
// one; messages for unknown keys go to the general error list.
async function applyServerFieldErrors(errors: Record<string, string>) {
  const byKey: Record<string, string> = {}
  const items: FdsErrorSummaryItem[] = []
  const general: string[] = []
  let firstStep = -1
  for (const [key, raw] of Object.entries(errors)) {
    const message = Array.isArray(raw) ? raw.join(' ') : String(raw)
    const step = steps.value.findIndex((s) => s.elements.includes(key))
    if (step === -1) {
      general.push(message)
      continue
    }
    if (firstStep === -1) {
      firstStep = step
    }
    byKey[key] = message
    items.push({ id: webformFieldId(key), message })
  }
  if (firstStep !== -1 && firstStep !== currentIndex.value) {
    await goToStep(firstStep)
  }
  fieldErrors.value = byKey
  summaryErrors.value = items
  validationErrors.value = general
  if (firstStep !== -1) {
    errorSteps.value = new Set([...errorSteps.value, firstStep])
  }
}

// The reference the citizen can quote: a case number when the backend sends
// one, else the submission id.
function referenceFrom(response: any): string | null {
  const attributes = response?.data?.attributes || {}
  const candidate = attributes.case_number
    ?? attributes.sagsnummer
    ?? attributes.reference
    ?? response?.case_number
    ?? response?.data?.id
    ?? response?.submission_id
    ?? response?.id
  return candidate === undefined || candidate === null || candidate === '' ? null : String(candidate)
}

// Submit form to backend
async function submitForm() {
  if (stopActive.value) {
    return
  }
  // Every step must validate; the first one with errors is shown.
  for (let i = 0; i < steps.value.length; i++) {
    const items = validateStep(i)
    if (items.length) {
      if (i !== currentIndex.value) {
        await goToStep(i)
      }
      applyErrors(i, items)
      return
    }
  }
  applyErrors(currentIndex.value, [])

  submitting.value = true
  validationErrors.value = []
  success.value = false

  try {
    // Same origin: the server adds the MitID session from its HttpOnly
    // cookie as workflow_id when there is one (#252).
    const response = await $fetch<any>(`/api/session/submit/${props.webformId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: `webform_submission--${props.webformId}`,
          attributes: {
            data: buildPayload(),
          }
        }
      })
    })

    receipt.value = {
      submittedAt: new Date(),
      reference: referenceFrom(response),
      rows: buildSummaryRows(true),
    }
    success.value = true
    liveMessage.value = t('form.receiptHeading')
    formData.value = {} // Reset form
    addressModels.value = {}

    await nextTick()
    receiptWrap.value?.focus()
    document.querySelector('.success')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (e: any) {
    const body = e?.data ?? e?.response?._data ?? e?.response?.data
    if (body?.errors && !Array.isArray(body.errors) && typeof body.errors === 'object') {
      // 422 { error, field, errors: { key: message } }: the message lands on
      // the field itself when the element is known.
      await applyServerFieldErrors(body.errors as Record<string, string>)
    } else if (Array.isArray(body?.errors)) {
      // Extract validation errors from JSON:API error response
      validationErrors.value = body.errors.map((err: any) =>
        err.detail || err.title || t('form.unknownError')
      )
    } else {
      validationErrors.value = [body?.error || e.message || t('form.submitError')]
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* Layout only; colours, type and the alert/button/field styling are DKFDS. */
.webform-renderer {
  max-width: 800px;
}

.loading {
  text-align: center;
  padding: 4rem 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
}

.webform-steps {
  margin-bottom: 2rem;
}

.webform-step__heading {
  outline-offset: 4px;
}

.webform-step__count {
  display: block;
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 0.25rem;
}

.webform-step__summary {
  margin-bottom: 2rem;
}

.webform-stop-notice {
  margin: 1rem 0 0;
  font-weight: 600;
}

.mitid-gate {
  padding: 2rem 0;
}

.mitid-gate-text {
  margin: 0 0 1.5rem 0;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.validation-errors,
.success {
  margin-top: 1.5rem;
}

.webform-receipt-wrap {
  outline: none;
}

@media print {
  .webform-receipt-wrap h1 {
    font-size: 1.5rem;
  }
}
</style>
