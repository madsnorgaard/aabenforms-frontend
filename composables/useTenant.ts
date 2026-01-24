import type { Tenant } from '~/types/tenant'

/**
 * Composable for tenant detection and configuration
 */
export const useTenant = () => {
  const tenant = useState<Tenant | null>('tenant', () => null)
  const { fetchResource } = useApi()

  /**
   * Detect tenant from current domain and fetch configuration
   */
  const detectTenant = async () => {
    if (import.meta.server) {
      return null
    }

    const hostname = window.location.hostname

    try {
      // Fetch tenant config from backend based on domain
      const response = await fetchResource(
        `node/tenant?filter[domain]=${hostname}`
      )

      if (response.data && response.data.length > 0) {
        tenant.value = response.data[0].attributes as Tenant
      }

      return tenant.value
    } catch (error) {
      console.error('Failed to fetch tenant config:', error)
      return null
    }
  }

  /**
   * Get current tenant configuration
   */
  const getTenant = () => {
    return tenant.value
  }

  return {
    tenant,
    detectTenant,
    getTenant
  }
}
