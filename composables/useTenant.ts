import type { Tenant } from '~/types/tenant'

/**
 * Composable for tenant detection and configuration.
 *
 * Uses Drupal Domain Access module for multi-tenancy.
 * Fetches domain-specific configuration including:
 * - Tenant name and domain
 * - Branding (logo, colors)
 * - Custom settings
 */
export const useTenant = () => {
  const tenant = useState<Tenant | null>('tenant', () => null)
  const loading = useState<boolean>('tenant:loading', () => false)
  const { fetchResource } = useApi()

  /**
   * Detect tenant from current domain and fetch configuration.
   *
   * Fetches from Drupal Domain module's domain records.
   * Domain records are stored in domain_record entity type.
   */
  const detectTenant = async () => {
    // Skip on server-side rendering
    if (import.meta.server) {
      return null
    }

    const hostname = window.location.hostname
    loading.value = true

    try {
      // Fetch domain configuration from Domain module
      // Domain records are exposed via JSON:API as domain/domain
      const response = await fetchResource('domain/domain', {
        params: {
          'filter[hostname]': hostname,
        },
      })

      if (response.data) {
        const domainData = Array.isArray(response.data) ? response.data[0] : response.data

        if (domainData) {
          // Map Domain module data to Tenant interface
          tenant.value = mapDomainToTenant(domainData)

          // Store in localStorage for persistence
          if (process.client) {
            localStorage.setItem('tenant_domain', hostname)
            localStorage.setItem('tenant_data', JSON.stringify(tenant.value))
          }
        }
      }

      return tenant.value
    } catch (error) {
      console.error('Failed to fetch tenant config:', error)

      // Try to restore from localStorage
      if (process.client) {
        const stored = localStorage.getItem('tenant_data')
        if (stored) {
          try {
            tenant.value = JSON.parse(stored)
          } catch (e) {
            // Invalid stored data, ignore
          }
        }
      }

      return tenant.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Map Domain module data to Tenant interface
   */
  function mapDomainToTenant(domainData: any): Tenant {
    const attrs = domainData.attributes || {}

    return {
      name: attrs.name || attrs.label || 'Default',
      domain: attrs.hostname || window.location.hostname,
      logo: attrs.logo_url || attrs.theme_logo,
      primaryColor: attrs.primary_color || attrs.color_primary || '#007acc',
      secondaryColor: attrs.secondary_color || attrs.color_secondary || '#28a745',
      settings: {
        // Domain-specific settings from third_party_settings
        ...(attrs.third_party_settings || {}),
        // Custom aabenforms settings
        contactEmail: attrs.contact_email,
        supportPhone: attrs.support_phone,
        enableMitId: attrs.enable_mitid !== false,
        defaultLanguage: attrs.default_language || 'da',
        timezone: attrs.timezone || 'Europe/Copenhagen',
      },
    }
  }

  /**
   * Get current tenant configuration
   */
  const getTenant = () => {
    return tenant.value
  }

  /**
   * Check if current domain is default tenant
   */
  const isDefaultTenant = computed(() => {
    if (!tenant.value) return true

    const defaultDomains = [
      'aabenforms.dk',
      'aabenforms.ddev.site',
      'localhost',
    ]

    return defaultDomains.some(domain =>
      tenant.value!.domain.includes(domain)
    )
  })

  /**
   * Apply tenant branding to page
   */
  const applyBranding = () => {
    if (!tenant.value || !process.client) return

    // Apply CSS custom properties for theming
    const root = document.documentElement

    if (tenant.value.primaryColor) {
      root.style.setProperty('--color-primary', tenant.value.primaryColor)
    }

    if (tenant.value.secondaryColor) {
      root.style.setProperty('--color-secondary', tenant.value.secondaryColor)
    }

    // Update page title with tenant name
    if (!isDefaultTenant.value) {
      document.title = `${tenant.value.name} - ÅbenForms`
    }
  }

  return {
    tenant: readonly(tenant),
    loading: readonly(loading),
    detectTenant,
    getTenant,
    isDefaultTenant,
    applyBranding,
  }
}
