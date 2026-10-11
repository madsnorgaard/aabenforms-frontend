<template>
  <div class="form-group" :class="{ 'form-error': !!error }">
    <label class="form-label" :for="id">
      {{ label }}<span v-if="optional" class="weight-normal"> {{ $t('fds.form.optional') }}</span><span v-else-if="requiredLabel" class="weight-normal"> {{ $t('fds.form.required') }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="form-hint">{{ hint }}</span>
    <span v-if="error" :id="errorId" class="form-error-message"><span class="sr-only">{{ $t('fds.form.errorPrefix') }}</span>{{ error }}</span>
    <input
      :id="id"
      :type="type"
      :name="name || id"
      class="form-input"
      :class="[widthClass, charClass, { 'form-input-error': !!error }]"
      :value="modelValue"
      :required="required || undefined"
      :disabled="disabled || undefined"
      :readonly="readonly || undefined"
      :placeholder="placeholder"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :min="min"
      :max="max"
      :step="step"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
    >
  </div>
</template>

<script setup lang="ts">
// DKFDS Inputfelt: form-group > label.form-label + span.form-hint +
// span.form-error-message + input.form-input. Error state adds form-error on
// the group, form-input-error + aria-invalid on the control, and the error id
// to aria-describedby. Mark the minority with `optional` ("(frivilligt)") or
// `requiredLabel` ("(*skal udfyldes)").
const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  id?: string
  name?: string
  label: string
  hint?: string
  error?: string
  type?: string
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
  disabled?: boolean
  readonly?: boolean
  /** DKFDS input-width-{xxs|xs|s|m|l|xl} (8 to 48rem of the DKFDS scale). */
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
  /** DKFDS input-char-{4|8|11|27}: sized to a known number of characters. */
  charWidth?: 4 | 8 | 11 | 27
  placeholder?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
  autocomplete?: string
  maxlength?: number | string
  min?: number | string
  max?: number | string
  step?: number | string
}>(), {
  type: 'text',
  required: false,
  optional: false,
  requiredLabel: false,
  disabled: false,
  readonly: false,
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
}>()

const { id, hintId, errorId } = useFdsFieldIds(props)

const widthClass = computed(() => (props.width ? `input-width-${props.width}` : null))
const charClass = computed(() => (props.charWidth ? `input-char-${props.charWidth}` : null))
const describedBy = computed(() => fdsDescribedBy([props.hint && hintId.value, props.error && errorId.value]))
</script>
