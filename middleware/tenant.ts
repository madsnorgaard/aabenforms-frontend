/**
 * Tenant detection middleware.
 *
 * Automatically detects tenant from domain and loads configuration
 * on every page navigation.
 *
 * Usage: Add to nuxt.config.ts as global middleware or use in specific pages.
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { tenant, detectTenant, applyBranding } = useTenant()

  // Only detect tenant if not already loaded
  if (!tenant.value && process.client) {
    await detectTenant()
    applyBranding()
  }
})
