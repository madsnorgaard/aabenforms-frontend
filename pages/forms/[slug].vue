<template>
  <div class="form-page">
    <div class="container">
      <WebformRenderer :webform-id="slug" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

// Set page meta
useHead({
  title: `Form: ${slug}`,
})
</script>

<style scoped>
.form-page {
  min-height: 100vh;
  padding: 4rem 0;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
