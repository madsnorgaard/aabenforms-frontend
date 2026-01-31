<template>
  <form @submit.prevent="submitForm" class="webform-renderer">
    <div v-if="loading" class="loading">
      <p>{{ $t('form.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <p class="error-message">{{ error }}</p>
      <button type="button" @click="loadForm" class="retry-button">
        {{ $t('form.retry') }}
      </button>
    </div>

    <div v-else-if="schema" class="form-fields">
      <!-- Render each form field -->
      <div
        v-for="(field, key) in schema.elements"
        :key="key"
        class="form-field"
        :class="`field-type-${field['#type']}`"
      >
        <!-- Text field -->
        <UiInput
          v-if="field['#type'] === 'textfield'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :type="'text'"
        />

        <!-- Email field -->
        <UiInput
          v-else-if="field['#type'] === 'email'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :type="'email'"
        />

        <!-- Textarea -->
        <UiTextarea
          v-else-if="field['#type'] === 'textarea'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :placeholder="field['#placeholder']"
          :rows="field['#rows'] || 4"
        />

        <!-- Select/dropdown -->
        <UiSelect
          v-else-if="field['#type'] === 'select'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          :options="field['#options'] || {}"
        />

        <!-- CPR field (custom) -->
        <UiInput
          v-else-if="field['#type'] === 'cpr'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          placeholder="DDMMYY-XXXX"
          type="text"
          maxlength="11"
          class="cpr-field"
        />

        <!-- CVR field (custom) -->
        <UiInput
          v-else-if="field['#type'] === 'cvr'"
          v-model="formData[key]"
          :label="field['#title']"
          :required="field['#required']"
          placeholder="12 34 56 78"
          type="text"
          maxlength="11"
          class="cvr-field"
        />

        <!-- DAWA Address (simplified for now) -->
        <div v-else-if="field['#type'] === 'dawa_address'" class="dawa-address-field">
          <label>{{ field['#title'] }}</label>
          <UiInput
            v-model="formData[key + '_search']"
            placeholder="Søg adresse..."
            type="text"
          />
          <UiInput
            v-model="formData[key + '_street']"
            placeholder="Vejnavn og nummer"
            type="text"
            readonly
          />
          <div class="address-details">
            <UiInput
              v-model="formData[key + '_postal_code']"
              placeholder="Postnr."
              type="text"
              class="postal-code"
              readonly
            />
            <UiInput
              v-model="formData[key + '_city']"
              placeholder="By"
              type="text"
              class="city"
              readonly
            />
          </div>
        </div>

        <!-- Fallback for unsupported field types -->
        <div v-else class="unsupported-field">
          <label>{{ field['#title'] }} ({{ field['#type'] }})</label>
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
      <div v-if="success" class="success">
        <p>{{ schema.settings?.confirmation_message || $t('form.success') }}</p>
      </div>

      <!-- Validation errors -->
      <div v-if="validationErrors.length > 0" class="validation-errors">
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

// State
const loading = ref(true)
const error = ref<string | null>(null)
const schema = ref<any>(null)
const formData = ref<Record<string, any>>({})
const submitting = ref(false)
const success = ref(false)
const validationErrors = ref<string[]>([])

// Load form schema on mount
onMounted(() => {
  loadForm()
})

// Load webform schema from backend
async function loadForm() {
  loading.value = true
  error.value = null

  try {
    const response = await fetchResource(`webform/webform/${props.webformId}`)
    schema.value = response.data.attributes
    loading.value = false
  } catch (e: any) {
    error.value = e.message || t('form.loadError')
    loading.value = false
  }
}

// Submit form to backend
async function submitForm() {
  submitting.value = true
  validationErrors.value = []
  success.value = false

  try {
    await postResource(`webform_submission/${props.webformId}`, {
      data: {
        type: `webform_submission--${props.webformId}`,
        attributes: {
          data: formData.value
        }
      }
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

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  position: relative;
}

.dawa-address-field {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.address-details {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.75rem;
}

.unsupported-field {
  padding: 1rem;
  background: #ffffcc;
  border: 1px solid #ffeb3b;
  border-radius: 4px;
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
