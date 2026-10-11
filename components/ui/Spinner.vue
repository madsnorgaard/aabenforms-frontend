<template>
  <div :class="['spinner-container', centerClass]">
    <div :class="['spinner', sizeClass, colorClass]" role="status" :aria-label="label">
      <span class="sr-only">{{ label }}</span>
    </div>
    <p v-if="message" :class="['spinner-message', messageSizeClass]">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'neutral'
  center?: boolean
  message?: string
  label?: string
}>(), {
  size: 'md',
  color: 'primary',
  center: false,
  label: 'Loading...'
})

const sizeClass = computed(() => `spinner-${props.size}`)
const colorClass = computed(() => `spinner-${props.color}`)
const centerClass = computed(() => props.center ? 'spinner-center' : '')
const messageSizeClass = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  return sizes[props.size]
})
</script>

<style scoped>
.spinner-container {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.spinner-center {
  justify-content: center;
  width: 100%;
  min-height: 200px;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Functional busy signal, so it stays, but slower under reduced motion. */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2.4s;
  }
}

/* Sizes */
.spinner-sm {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.spinner-md {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner-lg {
  width: 56px;
  height: 56px;
  border-width: 4px;
}

.spinner-xl {
  width: 72px;
  height: 72px;
  border-width: 5px;
}

/* Colors */
.spinner-primary {
  border-color: rgba(0, 89, 179, 0.2);
  border-top-color: #0059b3;
}

.spinner-secondary {
  border-color: rgba(0, 77, 153, 0.2);
  border-top-color: #004d99;
}

.spinner-white {
  border-color: rgba(255, 255, 255, 0.3);
  border-top-color: white;
}

.spinner-neutral {
  border-color: rgba(112, 112, 112, 0.2);
  border-top-color: #707070;
}

.spinner-message {
  color: #454545;
  font-weight: 500;
  margin: 0;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
