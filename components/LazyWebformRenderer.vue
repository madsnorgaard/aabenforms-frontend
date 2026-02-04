<template>
  <div ref="elementRef">
    <template v-if="isVisible">
      <WebformRenderer :webform-id="webformId" />
    </template>
    <template v-else>
      <div class="loading-placeholder">
        <UiSkeleton height="400px" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Lazy-loaded WebformRenderer component
 * Only loads when it enters the viewport
 */

const props = defineProps<{
  webformId: string
}>()

const { isVisible, elementRef } = useLazyComponent({
  rootMargin: '100px', // Start loading 100px before visible
  threshold: 0.1
})
</script>

<style scoped>
.loading-placeholder {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
