<template>
  <div class="form-group" :class="{ 'form-error': !!error }">
    <fieldset :aria-describedby="describedBy" :disabled="disabled || undefined">
      <legend class="form-label">
        {{ legend }}<span v-if="optional" class="weight-normal"> {{ $t('fds.form.optional') }}</span><span v-else-if="requiredLabel" class="weight-normal"> {{ $t('fds.form.required') }}</span>
      </legend>
      <span v-if="hint" :id="hintId" class="form-hint">{{ hint }}</span>
      <span v-if="error" :id="errorId" class="form-error-message"><span class="sr-only">{{ $t('fds.form.errorPrefix') }}</span>{{ error }}</span>
      <div v-for="(opt, index) in normalisedOptions" :key="String(opt.value)" class="form-group-radio">
        <input
          :id="optionId(index)"
          type="radio"
          class="form-radio"
          :name="name || id"
          :value="opt.value"
          :checked="modelValue === opt.value"
          :required="required || undefined"
          :disabled="opt.disabled || undefined"
          :aria-describedby="opt.hint ? `${optionId(index)}-hint` : undefined"
          @change="$emit('update:modelValue', opt.value)"
        >
        <label class="form-label" :for="optionId(index)">{{ opt.label }}</label>
        <span v-if="opt.hint" :id="`${optionId(index)}-hint`" class="form-hint">{{ opt.hint }}</span>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
// DKFDS Radioknapper: form-group > fieldset > legend.form-label + hint +
// error + form-group-radio (input.form-radio + label.form-label) per option.
export interface FdsRadioOption {
  value: string | number
  label: string
  hint?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  id?: string
  name?: string
  legend: string
  hint?: string
  error?: string
  options: FdsRadioOption[] | Record<string, string>
  required?: boolean
  optional?: boolean
  requiredLabel?: boolean
  disabled?: boolean
}>(), {
  required: false,
  optional: false,
  requiredLabel: false,
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const { id, hintId, errorId } = useFdsFieldIds(props)
const describedBy = computed(() => fdsDescribedBy([props.hint && hintId.value, props.error && errorId.value]))
const optionId = (index: number) => `${id.value}-option${index + 1}`

const normalisedOptions = computed<FdsRadioOption[]>(() =>
  Array.isArray(props.options)
    ? props.options
    : Object.entries(props.options || {}).map(([value, label]) => ({ value, label })),
)
</script>
