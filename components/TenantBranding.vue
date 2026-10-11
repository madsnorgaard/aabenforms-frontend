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

    <!-- Dynamic Theme Styles -->
    <component :is="'style'" v-if="tenant">
      :root {
        --color-primary: {{ tenant.primaryColor || '#0060a8' }};
        --color-primary-50: {{ lighten(tenant.primaryColor || '#0060a8', 0.95) }};
        --color-primary-100: {{ lighten(tenant.primaryColor || '#0060a8', 0.9) }};
        --color-primary-600: {{ tenant.primaryColor || '#0060a8' }};
        --color-primary-700: {{ darken(tenant.primaryColor || '#0060a8', 0.1) }};
        --color-primary-900: {{ darken(tenant.primaryColor || '#0060a8', 0.2) }};

        --color-secondary: {{ tenant.secondaryColor || '#28a745' }};
        --color-secondary-50: {{ lighten(tenant.secondaryColor || '#28a745', 0.95) }};
        --color-secondary-600: {{ tenant.secondaryColor || '#28a745' }};
        --color-secondary-700: {{ darken(tenant.secondaryColor || '#28a745', 0.1) }};
      }

      /* Apply to primary buttons */
      .bg-primary-600 {
        background-color: var(--color-primary-600) !important;
      }

      .bg-primary-700 {
        background-color: var(--color-primary-700) !important;
      }

      /* Text intentionally NOT re-coloured to the raw tenant primary: a
         mid-tone brand blue (e.g. #007acc) fails WCAG AA as small text on
         white. Eyebrow labels and links keep the Tailwind primary-600
         (#0071c9, >= 4.5:1), so accessibility does not depend on the tenant's
         chosen hue. Buttons/borders below still take the tenant colour. */

      .border-primary-600 {
        border-color: var(--color-primary-600) !important;
      }

      /* Apply to secondary buttons */
      .bg-secondary-600 {
        background-color: var(--color-secondary-600) !important;
      }

      .bg-secondary-700 {
        background-color: var(--color-secondary-700) !important;
      }
    </component>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  showLogo?: boolean
  showName?: boolean
}>()

const { tenant, detectTenant, applyBranding } = useTenant()

// Detect tenant on mount
onMounted(async () => {
  await detectTenant()
  applyBranding()
})

// Helper functions for color manipulation
function lighten(color: string, amount: number): string {
  // Simple lighten - convert hex to rgb, increase values
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const newR = Math.min(255, Math.floor(r + (255 - r) * amount))
  const newG = Math.min(255, Math.floor(g + (255 - g) * amount))
  const newB = Math.min(255, Math.floor(b + (255 - b) * amount))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

function darken(color: string, amount: number): string {
  // Simple darken - convert hex to rgb, decrease values
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const newR = Math.floor(r * (1 - amount))
  const newG = Math.floor(g * (1 - amount))
  const newB = Math.floor(b * (1 - amount))

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}
</script>

<style scoped>
.tenant-branding {
  /* This component is mostly invisible, it just injects styles */
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
