<template>
  <div class="form-group" :class="{ 'form-error': !!error }">
    <label class="form-label" :for="id">
      {{ label }}<span v-if="optional" class="weight-normal"> {{ $t('fds.form.optional') }}</span><span v-else-if="requiredLabel" class="weight-normal"> {{ $t('fds.form.required') }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="form-hint">{{ hint }}</span>
    <span v-if="error" :id="errorId" class="form-error-message"><span class="sr-only">{{ $t('fds.form.errorPrefix') }}</span>{{ error }}</span>
    <select
      :id="id"
      :name="name || id"
      class="form-select"
      :class="[widthClass, { 'form-input-error': !!error }]"
      :value="modelValue ?? ''"
      :required="required || undefined"
      :disabled="disabled || undefined"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      @blur="$emit('blur', $event)"
    >
      <option v-if="placeholder" value="">{{ placeholder }}</option>
      <option v-for="opt in normalisedOptions" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
// DKFDS Dropdown-menu: form-group > label + hint + error + select.form-select.
// `options` accepts the array shape or a Drupal-style value:label record.
export interface FdsSelectOption {
  value: string | number
  label: string
}

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  id?: string
  name?: string
  label: string
  hint?: string
  error?: string
  options: FdsSelectOption[] | Record<string, string>
  /** Rendered as the empty first option, e.g. "Vælg emne". */
  placeholder?: string
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
  disabled?: boolean
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
}>(), {
  required: false,
  optional: false,
  requiredLabel: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
}>()

const { id, hintId, errorId } = useFdsFieldIds(props)
const widthClass = computed(() => (props.width ? `input-width-${props.width}` : null))
const describedBy = computed(() => fdsDescribedBy([props.hint && hintId.value, props.error && errorId.value]))

const normalisedOptions = computed<FdsSelectOption[]>(() =>
  Array.isArray(props.options)
    ? props.options
    : Object.entries(props.options || {}).map(([value, label]) => ({ value, label })),
)
</script>
