<template>
  <div
    :class="['alert', `alert-${variant}`, { 'alert-dismissible': dismissible }]"
    role="alert"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <div class="alert-icon">
      <!-- Success Icon -->
      <svg v-if="variant === 'success'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>

      <!-- Error Icon -->
      <svg v-else-if="variant === 'error'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>

      <!-- Warning Icon -->
      <svg v-else-if="variant === 'warning'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
      </svg>

      <!-- Info Icon -->
      <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    </div>

    <div class="alert-content">
      <h3 v-if="title" class="alert-title">{{ title }}</h3>
      <div class="alert-message">
        <slot>{{ message }}</slot>
      </div>

      <!-- Action buttons -->
      <div v-if="$slots.actions || actions.length > 0" class="alert-actions">
        <slot name="actions">
          <button
            v-for="(action, index) in actions"
            :key="index"
            @click="action.onClick"
            :class="['alert-action-button', action.variant || 'primary']"
            type="button"
          >
            {{ action.label }}
          </button>
        </slot>
      </div>
    </div>

    <button
      v-if="dismissible"
      @click="$emit('dismiss')"
      class="alert-dismiss"
      type="button"
      :aria-label="$t('common.close') || 'Close'"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

const props = withDefaults(defineProps<{
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message?: string
  dismissible?: boolean
  actions?: Action[]
}>(), {
  variant: 'info',
  dismissible: false,
  actions: () => []
})

defineEmits<{
  dismiss: []
}>()
</script>

<style scoped>
.alert {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border-width: 1px;
  border-style: solid;
  position: relative;
  transition: all 0.2s ease;
}

.alert-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 2px;
}

.alert-icon svg {
  width: 100%;
  height: 100%;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.alert-message {
  font-size: 0.875rem;
  line-height: 1.5;
}

.alert-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.alert-action-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-height: 44px;
  min-width: 44px;
}

.alert-action-button.primary {
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
}

.alert-action-button.primary:hover {
  background: rgba(0, 0, 0, 0.15);
}

.alert-dismiss {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  transition: opacity 0.2s;
  border-radius: 4px;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-dismiss:hover {
  opacity: 1;
}

.alert-dismiss:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.alert-dismiss svg {
  width: 20px;
  height: 20px;
}

.alert-dismissible .alert-content {
  padding-right: 2rem;
}

/* Success variant */
.alert-success {
  background: #d4edda;
  border-color: #28a745;
  color: #155724;
}

.alert-success .alert-icon {
  color: #28a745;
}

/* Error variant */
.alert-error {
  background: #f8d7da;
  border-color: #dc3545;
  color: #721c24;
}

.alert-error .alert-icon {
  color: #dc3545;
}

/* Warning variant */
.alert-warning {
  background: #fff3cd;
  border-color: #ffc107;
  color: #856404;
}

.alert-warning .alert-icon {
  color: #ffc107;
}

/* Info variant */
.alert-info {
  background: #d1ecf1;
  border-color: #0c8feb;
  color: #0c5460;
}

.alert-info .alert-icon {
  color: #0c8feb;
}

/* Focus states for accessibility */
.alert:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>
