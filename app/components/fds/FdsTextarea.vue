<template>
  <div class="form-group" :class="{ 'form-error': !!error }">
    <label class="form-label" :for="id">
      {{ label }}<span v-if="optional" class="weight-normal"> {{ $t('fds.form.optional') }}</span><span v-else-if="requiredLabel" class="weight-normal"> {{ $t('fds.form.required') }}</span>
    </label>
    <span v-if="hint" :id="hintId" class="form-hint">{{ hint }}</span>
    <span v-if="error" :id="errorId" class="form-error-message"><span class="sr-only">{{ $t('fds.form.errorPrefix') }}</span>{{ error }}</span>
    <textarea
      :id="id"
      :name="name || id"
      class="form-input"
      :class="[widthClass, { 'form-input-error': !!error }]"
      :value="modelValue"
      :rows="rows"
      :required="required || undefined"
      :disabled="disabled || undefined"
      :readonly="readonly || undefined"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur', $event)"
    />
  </div>
</template>

<script setup lang="ts">
// DKFDS Tekstområde: same form-group contract as FdsInput with textarea.form-input.
const props = withDefaults(defineProps<{
  modelValue?: string | null
  id?: string
  name?: string
  label: string
  hint?: string
  error?: string
  rows?: number
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
  disabled?: boolean
  readonly?: boolean
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
  placeholder?: string
  maxlength?: number | string
}>(), {
  rows: 5,
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
const describedBy = computed(() => fdsDescribedBy([props.hint && hintId.value, props.error && errorId.value]))
</script>
