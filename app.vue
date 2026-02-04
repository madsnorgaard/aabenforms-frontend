<template>
  <div id="app">
    <!-- Apply tenant-specific branding -->
    <TenantBranding />

    <!-- Render current page -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// This is the root component of the Nuxt app
// Pages will be rendered inside <NuxtPage />
// TenantBranding component automatically detects and applies tenant-specific styling
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}
</style>
