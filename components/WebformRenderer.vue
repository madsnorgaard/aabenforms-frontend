<template>
  <form
    @submit.prevent="submitForm"
    class="webform-renderer"
    :aria-label="schema?.title || 'Form'"
    novalidate
  >
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
      <p class="error-message">{{ error }}</p>
      <button type="button" @click="loadForm" class="retry-button">
        {{ $t('form.retry') }}
      </button>
    </div>

    <!-- MitID gate: the flow behind this form validates identity, so demand a
         session before showing the fields at all. -->
    <div v-else-if="mitidGateActive" class="mitid-gate" role="region" :aria-label="$t('auth.loginRequired')">
      <p class="mitid-gate-text">{{ $t('form.mitidRequired') }}</p>
      <UiButton type="button" class="mitid-login-button" @click="startMitidLogin">
        {{ $t('auth.loginWithMitId') }}
      </UiButton>
    </div>

    <div v-else-if="schema" class="form-fields">
      <h1 v-if="schema.title" class="webform-title">{{ schema.title }}</h1>
      <div v-if="schema.requires_mitid && isAuthenticated" class="mitid-session-banner" role="status">
        {{ $t('form.mitidLoggedInAs') }} <strong>{{ user?.name }}</strong>
      </div>
      <!-- Render each form field -->
      <div
        v-for="(field, key) in schema.elements"
        :key="key"
        class="form-field"
        :class="[`field-type-${field['#type']}`, `field-key-${cssSafe(String(key))}`]"
      >
        <!-- Text field -->
        <UiInput
          v-if="field['#type'] === 'textfield'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          :type="'text'"
        />

        <!-- Email field -->
        <UiInput
          v-else-if="field['#type'] === 'email'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          autocomplete="email"
          :type="'email'"
        />

        <!-- Textarea -->
        <UiTextarea
          v-else-if="field['#type'] === 'textarea'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          :rows="field['#rows'] || 4"
        />

        <!-- Select/dropdown -->
        <UiSelect
          v-else-if="field['#type'] === 'select'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          :options="field['#options'] || {}"
        />

        <!-- CPR field (custom; 'cpr_field' is the legacy element id) -->
        <UiInput
          v-else-if="field['#type'] === 'cpr' || field['#type'] === 'cpr_field'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          placeholder="DDMMYY-XXXX"
          type="text"
          input-mode="numeric"
          autocomplete="off"
          maxlength="11"
          class="cpr-field"
        />

        <!-- CVR field (custom) -->
        <UiInput
          v-else-if="field['#type'] === 'cvr'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          placeholder="12 34 56 78"
          type="text"
          input-mode="numeric"
          autocomplete="off"
          maxlength="11"
          class="cvr-field"
        />

        <!-- Number field -->
        <UiInput
          v-else-if="field['#type'] === 'number'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :help-text="field['#description']"
          :error="fieldErrors[key]"
          :type="'number'"
        />

        <!-- Hidden field: no visible output -->
        <template v-else-if="field['#type'] === 'hidden'" />

        <!-- Danish address autocomplete (Adressevælger) -->
        <AddressAutocomplete
          v-else-if="field['#type'] === 'address'"
          :model-value="addressModels[key] || null"
          :label="field['#title']"
          :required="field['#required']"
          :error="fieldErrors[key]"
          @update:model-value="(v) => onAddressUpdate(String(key), v)"
        />

        <!-- Fallback for unsupported field types -->
        <div v-else class="unsupported-field">
          <p class="unsupported-label">{{ field['#title'] }} ({{ field['#type'] }})</p>
          <p class="field-notice">{{ $t('form.unsupportedFieldType') }}</p>
        </div>
      </div>

      <!-- Submit button -->
      <div class="form-actions">
        <UiButton
          type="submit"
          :disabled="submitting"
          class="submit-button"
        >
          {{ submitting ? $t('form.submitting') : (schema.settings?.submit_label || $t('form.submit')) }}
        </UiButton>
      </div>

      <!-- Success message -->
      <div
        v-if="success"
        class="success"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>{{ schema.settings?.confirmation_message || $t('form.success') }}</p>
      </div>

      <!-- Validation errors -->
      <div
        v-if="validationErrors.length > 0"
        class="validation-errors"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="form-errors"
      >
        <p class="error-title">{{ $t('form.validationErrors') }}</p>
        <ul>
          <li v-for="(err, idx) in validationErrors" :key="idx">{{ err }}</li>
        </ul>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  webformId: string
}>()

const { fetchResource, postResource } = useApi()
const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user, sessionId, login, restoreSession } = useAuth()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const schema = ref<any>(null)
const formData = ref<Record<string, any>>({})
const addressModels = ref<Record<string, { id: string; street: string; postal_code: string; city: string } | null>>({})
const submitting = ref(false)
const success = ref(false)
const validationErrors = ref<string[]>([])
// Per-field error messages keyed by element key. Bound to each field's :error
// so the primitives' aria-invalid + aria-describedby + role=alert light up.
const fieldErrors = ref<Record<string, string>>({})

// Mirror a selected address into the flat keys the backend expects
// (`<key>_street`, `<key>_postal_code`, `<key>_city`, `<key>_id`).
function onAddressUpdate(key: string, value: { id: string; street: string; postal_code: string; city: string } | null) {
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
    const response = await $fetch(`${config.public.apiBase}/api/webform/${props.webformId}`, {
      method: 'GET'
    })

    // Check if we got a valid response
    if (!response.data || !response.data.attributes) {
      throw new Error(t('form.loadError'))
    }

    schema.value = response.data.attributes

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
  return value !== undefined && value !== null && String(value).trim() !== ''
}

// Client-side required validation. Populates fieldErrors (per-field, named) and
// the validation summary, and returns the first invalid element key (or null).
// Error text names the field ("Byggeadresse er paakraevet"), per WCAG 3.3.1.
function validateRequired(): string | null {
  fieldErrors.value = {}
  validationErrors.value = []
  let firstInvalid: string | null = null
  for (const [key, field] of Object.entries<any>(schema.value?.elements || {})) {
    if (field['#type'] === 'hidden' || !field['#required']) {
      continue
    }
    if (!fieldHasValue(key, field)) {
      const label = field['#title'] || key
      const message = t('form.fieldRequired', { field: label })
      fieldErrors.value[key] = message
      validationErrors.value.push(message)
      if (firstInvalid === null) {
        firstInvalid = key
      }
    }
  }
  return firstInvalid
}

// Moves keyboard focus to the first invalid field so a keyboard/AT user is
// taken straight to what needs fixing (WCAG 3.3.1 / focus management).
function focusField(key: string) {
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(
      `.form-field.field-key-${cssSafe(key)} input, .form-field.field-key-${cssSafe(key)} select, .form-field.field-key-${cssSafe(key)} textarea`
    )
    el?.focus()
  }, 50)
}

// A CSS-attribute-safe version of an element key for the selector above.
function cssSafe(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '-')
}

// Submit form to backend
async function submitForm() {
  const firstInvalid = validateRequired()
  if (firstInvalid !== null) {
    focusField(firstInvalid)
    return
  }

  submitting.value = true
  validationErrors.value = []
  success.value = false

  try {
    const config = useRuntimeConfig()

    // Use custom API endpoint for submission
    await $fetch(`${config.public.apiBase}/api/webform/${props.webformId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: `webform_submission--${props.webformId}`,
          attributes: {
            data: formData.value,
            // The MitID session id doubles as the workflow id the backend
            // identity gate validates (cross-origin, so it rides in the
            // payload rather than a shared cookie).
            ...(sessionId.value ? { workflow_id: sessionId.value } : {})
          }
        }
      })
    })

    success.value = true
    formData.value = {} // Reset form

    // Scroll to success message
    setTimeout(() => {
      document.querySelector('.success')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

  } catch (e: any) {
    if (e.response?.data?.errors) {
      // Extract validation errors from JSON:API error response
      validationErrors.value = e.response.data.errors.map((err: any) =>
        err.detail || err.title || t('form.unknownError')
      )
    } else {
      validationErrors.value = [e.message || t('form.submitError')]
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.webform-renderer {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.loading {
  text-align: center;
  padding: 4rem 0;
  color: #666;
}

.error {
  padding: 2rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  color: #c00;
  margin-bottom: 1rem;
}

.retry-button {
  padding: 0.5rem 1rem;
  background: #c00;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background: #a00;
}

.webform-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.unsupported-label {
  font-weight: 600;
  color: #262626;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  position: relative;
}

.unsupported-field {
  padding: 1rem;
  background: #ffffcc;
  border: 1px solid #ffeb3b;
  border-radius: 4px;
}

.mitid-gate {
  padding: 2rem;
  background: #f0f6fc;
  border: 1px solid #b6d4f0;
  border-radius: 8px;
  text-align: center;
}

.mitid-gate-text {
  margin: 0 0 1.5rem 0;
}

.mitid-session-banner {
  padding: 0.75rem 1rem;
  background: #efe;
  border: 1px solid #cec;
  border-radius: 8px;
  color: #060;
  font-size: 0.9rem;
}

.field-notice {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #666;
}

.form-actions {
  margin-top: 2rem;
}

.submit-button {
  width: 100%;
}

.success {
  margin-top: 2rem;
  padding: 1rem;
  background: #efe;
  border: 1px solid #cec;
  border-radius: 8px;
  color: #060;
  text-align: center;
}

.validation-errors {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
}

.error-title {
  color: #c00;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.validation-errors ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #c00;
}
</style>
