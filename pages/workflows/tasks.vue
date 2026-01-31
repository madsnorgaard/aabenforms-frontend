<template>
  <div class="tasks-page">
    <WorkflowDashboard />
  </div>
</template>

<script setup lang="ts">
// Protect this route with authentication
definePageMeta({
  middleware: 'auth',
})

// Set page meta
useHead({
  title: 'My Tasks - ÅbenForms',
})
</script>

<style scoped>
.tasks-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 2rem 0;
}
</style>
