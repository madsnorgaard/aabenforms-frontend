<template>
  <FdsInput
    :id="id"
    :model-value="modelValue ?? ''"
    :label="label || ''"
    :type="type"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :error="error"
    :hint="helpText"
    :inputmode="inputMode"
    :autocomplete="autocomplete"
    :maxlength="maxlength"
    :width="width"
    :char-width="charWidth"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
// Compatibility wrapper around components/fds/FdsInput (helpText -> hint,
// inputMode -> inputmode). New code should use FdsInput directly.
withDefaults(defineProps<{
  modelValue?: string | number | null
  id?: string
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none'
  autocomplete?: string
  maxlength?: number | string
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
  charWidth?: 4 | 8 | 11 | 27
}>(), {
  type: 'text',
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
