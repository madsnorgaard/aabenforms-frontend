<template>
  <FdsSelect
    :id="id"
    :model-value="modelValue ?? ''"
    :label="label || ''"
    :options="options"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :error="error"
    :hint="helpText"
    :width="width"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
// Compatibility wrapper around components/fds/FdsSelect.
withDefaults(defineProps<{
  modelValue?: string | number | null
  id?: string
  label?: string
  options: Array<{ value: string | number; label: string }> | Record<string, string>
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
  width?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'
}>(), {
  required: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
