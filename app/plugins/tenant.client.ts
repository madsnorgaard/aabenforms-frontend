/**
 * Tenant detection plugin.
 *
 * Automatically detects tenant on app initialization
 * and applies branding.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const { detectTenant, applyBranding } = useTenant()

  // Detect tenant on app startup
  await detectTenant()
  applyBranding()

  // Re-apply branding after navigation (in case of SPA navigation)
  nuxtApp.hook('page:finish', () => {
    applyBranding()
  })
})
