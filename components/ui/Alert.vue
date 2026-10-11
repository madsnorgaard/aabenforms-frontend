<template>
  <FdsAlert
    :type="variant"
    :heading="title"
    :dismissible="dismissible"
    @close="$emit('dismiss')"
  >
    <p v-if="message || $slots.default"><slot>{{ message }}</slot></p>
    <div v-if="$slots.actions || actions.length > 0" class="button-group mt-3">
      <slot name="actions">
        <FdsButton
          v-for="(action, index) in actions"
          :key="index"
          variant="secondary"
          @click="action.onClick"
        >
          {{ action.label }}
        </FdsButton>
      </slot>
    </div>
  </FdsAlert>
</template>

<script setup lang="ts">
// Compatibility wrapper around components/fds/FdsAlert (variant -> type,
// title -> heading). Action buttons render as DKFDS secondary buttons.
interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

withDefaults(defineProps<{
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message?: string
  dismissible?: boolean
  actions?: Action[]
}>(), {
  variant: 'info',
  dismissible: false,
  actions: () => [],
})

defineEmits<{
  dismiss: []
}>()
</script>
