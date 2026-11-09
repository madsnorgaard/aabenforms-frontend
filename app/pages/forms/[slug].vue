<template>
  <div>
    <SiteHeader />
    <main id="main" tabindex="-1" class="container py-8">
      <WebformRenderer :webform-id="slug" />
    </main>
    <FdsFooter />
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
