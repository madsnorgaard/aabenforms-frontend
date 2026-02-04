<template>
  <div ref="elementRef">
    <template v-if="isVisible">
      <AppointmentPicker
        :workflow-id="workflowId"
        :submission-id="submissionId"
        :api-endpoint="apiEndpoint"
        :default-days-ahead="defaultDaysAhead"
        @slot-selected="$emit('slotSelected', $event)"
        @booking-confirmed="$emit('bookingConfirmed', $event)"
        @booking-cancelled="$emit('bookingCancelled')"
        @error="$emit('error', $event)"
      />
    </template>
    <template v-else>
      <div class="loading-placeholder">
        <UiSkeleton height="500px" />
        <p class="loading-text">Loading appointment calendar...</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Lazy-loaded AppointmentPicker component
 * Only loads when it enters the viewport
 */

const props = withDefaults(defineProps<{
  workflowId?: string
  submissionId?: string
  apiEndpoint?: string
  defaultDaysAhead?: number
}>(), {
  apiEndpoint: '/api/workflow/calendar/slots',
  defaultDaysAhead: 30
})

const emit = defineEmits<{
  slotSelected: [slot: any]
  bookingConfirmed: [slot: any]
  bookingCancelled: []
  error: [error: string]
}>()

const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px',
  threshold: 0.1
})
</script>

<style scoped>
.loading-placeholder {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-text {
  color: #666;
  font-size: 0.875rem;
}
</style>
