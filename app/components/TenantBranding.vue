<template>
  <div class="tenant-branding">
    <!-- Tenant Logo -->
    <div v-if="showLogo && tenant?.logo" class="tenant-logo">
      <img :src="tenant.logo" :alt="`${tenant.name} logo`" />
    </div>

    <!-- Tenant Name (a branding label, not the page heading, to keep a single
         h1 per page). -->
    <div v-if="showName" class="tenant-name">
      <p class="tenant-name-text">{{ tenant?.name || 'ÅbenForms' }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  showLogo?: boolean
  showName?: boolean
}>()

const { tenant, detectTenant, applyBranding } = useTenant()

// Detect tenant on mount. The colours are applied as CSS custom properties
// on <html> through the CSSOM (stores/tenant.ts applyBranding), never as a
// generated <style> element: the Content-Security-Policy allows no inline
// style elements, and a style element built from tenant data would let a
// tenant record inject arbitrary CSS.
onMounted(async () => {
  await detectTenant()
  applyBranding()
})

</script>

<style>
/* Tenant colour hooks. The variables are set on :root by applyBranding();
   without a tenant the defaults below apply. Text is intentionally NOT
   re-coloured to the raw tenant primary: a mid-tone brand blue fails WCAG AA
   as small text on white, so eyebrow labels and links keep the Tailwind
   primary-600. Buttons and borders take the tenant colour. */
:root {
  --color-primary: #0060a8;
  --color-primary-50: #f2f7fb;
  --color-primary-100: #e6eff6;
  --color-primary-600: #0060a8;
  --color-primary-700: #005697;
  --color-primary-900: #004c86;
  --color-secondary: #28a745;
  --color-secondary-50: #f4fbf6;
  --color-secondary-600: #28a745;
  --color-secondary-700: #24963e;
}

.bg-primary-600 {
  background-color: var(--color-primary-600) !important;
}

.bg-primary-700 {
  background-color: var(--color-primary-700) !important;
}

.border-primary-600 {
  border-color: var(--color-primary-600) !important;
}

.bg-secondary-600 {
  background-color: var(--color-secondary-600) !important;
}

.bg-secondary-700 {
  background-color: var(--color-secondary-700) !important;
}
</style>

<style scoped>
.tenant-branding {
  /* Mostly invisible: it carries the logo and name when asked for. */
}

.tenant-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.tenant-logo img {
  max-width: 200px;
  height: auto;
}

.tenant-name-text {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary, #0060a8);
  margin: 0 0 1rem 0;
}
</style>
