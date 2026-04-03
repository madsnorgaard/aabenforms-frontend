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
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Atkinson Hyperlegible Next', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #262626;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
