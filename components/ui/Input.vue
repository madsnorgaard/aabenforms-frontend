<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-neutral-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-error-600" aria-label="required">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :class="inputClasses"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="getAriaDescribedBy()"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="helpText" :id="`${inputId}-help`" class="mt-1 text-sm text-neutral-500">{{ helpText }}</p>
    <p v-if="error" :id="`${inputId}-error`" class="mt-1 text-sm text-error-600" role="alert">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helpText?: string
}>(), {
  type: 'text',
  required: false,
  disabled: false
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = `input-${Math.random().toString(36).substr(2, 9)}`

const inputClasses = computed(() => {
  const base = 'block w-full rounded-lg border px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-neutral-100 disabled:cursor-not-allowed min-h-[44px]'
  const errorState = props.error
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'

  return `${base} ${errorState}`
})

function getAriaDescribedBy(): string | undefined {
  const ids: string[] = []
  if (props.helpText) ids.push(`${inputId}-help`)
  if (props.error) ids.push(`${inputId}-error`)
  return ids.length > 0 ? ids.join(' ') : undefined
}
</script>
