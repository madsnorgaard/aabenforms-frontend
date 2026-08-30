<template>
  <div class="form-page">
    <main id="main" tabindex="-1" class="container">
      <WebformRenderer :webform-id="slug" />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

// Set page meta. The human-readable form title comes from the schema (rendered
// as the h1); this is the browser-tab fallback before the schema loads.
const { t } = useI18n()
useHead({
  title: t('form.pageTitle'),
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
