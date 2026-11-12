<template>
  <FdsButton
    :type="type"
    :variant="fdsVariant"
    :disabled="disabled"
    :class="{ 'w-percent-100': fullWidth }"
    @click="$emit('click', $event)"
  >
    <slot />
  </FdsButton>
</template>

<script setup lang="ts">
// Compatibility wrapper: existing call sites keep <UiButton>, the markup is
// DKFDS (components/fds/FdsButton). `size` is accepted and ignored (DKFDS
// buttons have one size); outline maps to secondary, ghost to tertiary.
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const fdsVariant = computed(() => {
  switch (props.variant) {
    case 'outline':
      return 'secondary'
    case 'ghost':
      return 'tertiary'
    default:
      return props.variant
  }
})
</script>
