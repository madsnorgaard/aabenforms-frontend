import type { Tenant } from '~/types/tenant'
import { useTenantStore } from '~/stores/tenant'

/**
 * Composable for tenant detection and configuration.
 *
 * Uses Drupal Domain Access module for multi-tenancy.
 * Fetches domain-specific configuration including:
 * - Tenant name and domain
 * - Branding (logo, colors)
 * - Custom settings
 *
 * Now uses Pinia tenant store for centralized state management.
 */
export const useTenant = () => {
  const tenantStore = useTenantStore()

  // Access state from Pinia store
  const tenant = computed(() => tenantStore.tenant)
  const loading = computed(() => tenantStore.loading)
  const isDefaultTenant = computed(() => tenantStore.isDefaultTenant)

  /**
   * Detect tenant from current domain and fetch configuration.
   * Delegates to Pinia store.
   */
  const detectTenant = async () => {
    return await tenantStore.detectTenant()
  }

  /**
   * Get current tenant configuration
   */
  const getTenant = () => {
    return tenantStore.tenant
  }

  /**
   * Apply tenant branding to page
   */
  const applyBranding = () => {
    tenantStore.applyBranding()
  }

  return {
    // State (from Pinia store)
    tenant,
    loading,
    isDefaultTenant,

    // Methods
    detectTenant,
    getTenant,
    applyBranding,
  }
}
