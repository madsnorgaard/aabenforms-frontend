<template>
  <div class="w-full">
    <label v-if="label" :for="textareaId" class="block text-sm font-medium text-neutral-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-error-600">*</span>
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      :class="textareaClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="helpText" class="mt-1 text-sm text-neutral-500">{{ helpText }}</p>
    <p v-if="error" class="mt-1 text-sm text-error-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
  rows?: number
}>(), {
  required: false,
  disabled: false,
  rows: 4
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`

const textareaClasses = computed(() => {
  const base = 'block w-full rounded-lg border px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-neutral-100 disabled:cursor-not-allowed resize-y'
  const errorState = props.error
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'

  return `${base} ${errorState}`
})
</script>
