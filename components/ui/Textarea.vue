<template>
  <FdsTextarea
    :id="id"
    :model-value="modelValue ?? ''"
    :label="label || ''"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :error="error"
    :hint="helpText"
    :rows="rows"
    :width="width"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
// Compatibility wrapper around components/fds/FdsTextarea.
withDefaults(defineProps<{
  modelValue?: string | null
  id?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
  rows?: number
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
}>(), {
  required: false,
  disabled: false,
  rows: 4,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
