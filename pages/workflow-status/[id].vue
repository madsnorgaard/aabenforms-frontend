<template>
  <div class="workflow-status-page">
    <div class="container">
      <WorkflowExecutionTracker
        :execution-id="executionId"
        :auto-refresh="true"
        :refresh-interval="2000"
      />

      <div class="actions-section">
        <NuxtLink to="/" class="back-link">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const executionId = computed(() => route.params.id as string)

// Set page metadata
useHead({
  title: 'Workflow Status - ÅbenForms',
  meta: [
    {
      name: 'description',
      content: 'Track your application progress in real-time'
    }
  ]
})
</script>

<style scoped>
.workflow-status-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

.actions-section {
  margin-top: 2rem;
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #007acc;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.back-link:hover {
  background: #007acc;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
}

.icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 640px) {
  .workflow-status-page {
    padding: 1rem 0;
  }
}
</style>
