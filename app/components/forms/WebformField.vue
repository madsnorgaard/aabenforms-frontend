<template>
  <div
    class="form-field"
    :class="[`field-type-${element['#type']}`, `field-key-${webformCssSafe(fieldKey)}`]"
  >
    <!-- Text field -->
    <FdsInput
      v-if="type === 'textfield'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      type="text"
      @update:model-value="onInput"
    />

    <!-- Email field -->
    <FdsInput
      v-else-if="type === 'email'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      autocomplete="email"
      inputmode="email"
      type="email"
      width="l"
      @update:model-value="onInput"
    />

    <!-- Telephone -->
    <FdsInput
      v-else-if="type === 'tel'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      autocomplete="tel"
      inputmode="tel"
      type="tel"
      width="s"
      @update:model-value="onInput"
    />

    <!-- Date: native date input (DKFDS datepicker needs its own module) -->
    <FdsInput
      v-else-if="type === 'date'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      type="date"
      width="s"
      :min="element['#date_date_min']"
      :max="element['#date_date_max']"
      @update:model-value="onInput"
    />

    <!-- Textarea -->
    <FdsTextarea
      v-else-if="type === 'textarea'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      :rows="element['#rows'] || 5"
      @update:model-value="onInput"
    />

    <!-- Select/dropdown -->
    <FdsSelect
      v-else-if="type === 'select'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      :options="element['#options'] || {}"
      :placeholder="$t('form.selectPlaceholder')"
      width="l"
      @update:model-value="onInput"
    />

    <!-- Radios -->
    <FdsRadioGroup
      v-else-if="type === 'radios'"
      :id="id"
      :model-value="modelValue ?? null"
      :legend="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      :options="element['#options'] || {}"
      @update:model-value="onInput"
    />

    <!-- Single checkbox (declaration, consent) -->
    <FdsCheckbox
      v-else-if="type === 'checkbox'"
      :id="id"
      :model-value="!!modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      @update:model-value="onInput"
    />

    <!-- CPR field (custom; 'cpr_field' is the legacy element id) -->
    <FdsInput
      v-else-if="type === 'cpr' || type === 'cpr_field'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint || $t('form.cprHint')"
      :error="error"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="11"
      :char-width="11"
      class="cpr-field"
      @update:model-value="onInput"
    />

    <!-- CVR field (custom) -->
    <FdsInput
      v-else-if="type === 'cvr' || type === 'cvr_field'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint || $t('form.cvrHint')"
      :error="error"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      maxlength="11"
      :char-width="11"
      class="cvr-field"
      @update:model-value="onInput"
    />

    <!-- Number field -->
    <FdsInput
      v-else-if="type === 'number'"
      :id="id"
      :model-value="modelValue"
      :label="label"
      :required="required"
      :optional="optional"
      :required-label="requiredLabel"
      :hint="hint"
      :error="error"
      type="number"
      inputmode="numeric"
      width="xs"
      :min="element['#min']"
      :max="element['#max']"
      :step="element['#step']"
      @update:model-value="onInput"
    />

    <!-- Markup / processed text: admin-authored HTML. With
         data-aabenforms-alert it is a DKFDS besked (stop = error). -->
    <div
      v-else-if="isMarkup"
      :id="id"
      class="webform-markup"
      :class="alertKind ? `webform-alert webform-alert--${alertKind}` : null"
      :data-aabenforms-alert="alertKind || undefined"
    >
      <FdsAlert v-if="alertKind" :type="alertType" :heading="label || undefined">
        <div v-html="markup" />
      </FdsAlert>
      <div v-else v-html="markup" />
    </div>

    <!-- Hidden field: no visible output -->
    <template v-else-if="type === 'hidden'" />

    <!-- Danish address autocomplete (Adressevælger) -->
    <AddressAutocomplete
      v-else-if="type === 'address'"
      :model-value="addressModel || null"
      :label="label"
      :required="required"
      :error="error"
      @update:model-value="(v) => $emit('update:addressModel', v)"
    />

    <!-- Fallback for unsupported field types -->
    <div v-else class="unsupported-field">
      <FdsAlert type="warning" :heading="`${label} (${type})`" :text="$t('form.unsupportedFieldType')" paragraph />
    </div>
  </div>
</template>

<script setup lang="ts">
// One Webform element rendered with the DKFDS components. The renderer owns
// the data, the visibility (`#states`) and the validation; this component
// only maps the element type to a control and reports the value back.
import { isMarkupElement, webformCssSafe, webformFieldId } from '~/composables/useWebformStates'

export interface AddressModel {
  id: string
  street: string
  postal_code: string
  city: string
}

const props = defineProps<{
  element: Record<string, any>
  fieldKey: string
  modelValue?: any
  addressModel?: AddressModel | null
  error?: string
  /** Effective required flag (static `#required` or via `#states`). */
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'update:addressModel': [value: AddressModel | null]
}>()

const type = computed<string>(() => props.element['#type'])
const label = computed<string>(() => props.element['#title'] || '')
const hint = computed<string | undefined>(() => props.element['#description'] || undefined)
const id = computed(() => webformFieldId(props.fieldKey))
const isMarkup = computed(() => isMarkupElement(props.element))

const markup = computed<string>(() => {
  const el = props.element
  return el['#markup'] ?? el['#text'] ?? ''
})

// 'stop' blocks Næste/submit (handled by the renderer); 'warning' and 'info'
// only inform. Anything else is plain markup.
const alertKind = computed<'stop' | 'warning' | 'info' | 'success' | null>(() => {
  const raw = props.element['#attributes']?.['data-aabenforms-alert']
  if (raw === 'stop' || raw === 'error') return 'stop'
  if (raw === 'warning' || raw === 'info' || raw === 'success') return raw
  return null
})
const alertType = computed<'error' | 'warning' | 'info' | 'success'>(() =>
  alertKind.value === 'stop' ? 'error' : (alertKind.value || 'info'),
)

function onInput(value: any) {
  emit('update:modelValue', value)
}
</script>


<style scoped>
.form-field {
  position: relative;
}

.webform-markup :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
