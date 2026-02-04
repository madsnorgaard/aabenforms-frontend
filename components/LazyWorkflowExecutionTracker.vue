<template>
  <div ref="elementRef">
    <template v-if="isVisible">
      <WorkflowExecutionTracker
        :execution-id="executionId"
        :workflow-id="workflowId"
        :auto-refresh="autoRefresh"
        :refresh-interval="refreshInterval"
      />
    </template>
    <template v-else>
      <div class="loading-placeholder">
        <UiSkeleton height="600px" />
        <p class="loading-text">Loading workflow status...</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Lazy-loaded WorkflowExecutionTracker component
 * Only loads when it enters the viewport
 */

const props = withDefaults(defineProps<{
  executionId?: string
  workflowId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}>(), {
  autoRefresh: true,
  refreshInterval: 2000
})

const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px',
  threshold: 0.1
})
</script>

<style scoped>
.loading-placeholder {
  min-height: 600px;
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
