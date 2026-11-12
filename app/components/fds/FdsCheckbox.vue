<template>
  <div class="form-group" :class="{ 'form-error': !!error }">
    <span v-if="error" :id="errorId" class="form-error-message"><span class="sr-only">{{ $t('fds.form.errorPrefix') }}</span>{{ error }}</span>
    <div class="form-group-checkbox">
      <input
        :id="id"
        type="checkbox"
        class="form-checkbox"
        :name="name || id"
        :value="value"
        :checked="modelValue"
        :required="required || undefined"
        :disabled="disabled || undefined"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      >
      <label class="form-label" :for="id">
        <slot>{{ label }}</slot><span v-if="optional" class="weight-normal"> {{ $t('fds.form.optional') }}</span><span v-else-if="requiredLabel" class="weight-normal"> {{ $t('fds.form.required') }}</span>
      </label>
      <span v-if="hint" :id="hintId" class="form-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// DKFDS Tjekboks (single): form-group-checkbox > input.form-checkbox +
// label.form-label + span.form-hint. Boolean v-model. The label slot allows
// inline links ("Jeg accepterer <a>vilkårene</a>").
const props = withDefaults(defineProps<{
  modelValue?: boolean
  id?: string
  name?: string
  label?: string
  value?: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
  disabled?: boolean
}>(), {
  modelValue: false,
  value: '1',
  required: false,
  optional: false,
  requiredLabel: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { id, hintId, errorId } = useFdsFieldIds(props)
const describedBy = computed(() => fdsDescribedBy([props.hint && hintId.value, props.error && errorId.value]))
</script>
