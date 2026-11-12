<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || undefined"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
// DKFDS Knapper: button.button.button-{primary|secondary|tertiary|warning}.
// One primary per view; buttons act, links navigate; warning only for
// irreversible actions.
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'tertiary' | 'warning'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  /** Full width below the sm breakpoint (DKFDS xs-full-width). */
  fullWidthXs?: boolean
  /** Icon-only button (DKFDS button-icon-only); put a .sr-only label in the slot. */
  iconOnly?: boolean
}>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  fullWidthXs: false,
  iconOnly: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const classes = computed(() => [
  'button',
  `button-${props.variant}`,
  { 'xs-full-width': props.fullWidthXs, 'button-icon-only': props.iconOnly },
])
</script>
