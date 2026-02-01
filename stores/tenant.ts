import { defineStore } from 'pinia'
import type { Tenant, DomainRecord } from '~/types/tenant'

interface TenantState {
  tenant: Tenant | null
  loading: boolean
  error: string | null
}

/**
 * Tenant store for managing multi-tenancy state
 * Replaces the useState pattern in useTenant composable
 */
export const useTenantStore = defineStore('tenant', {
  state: (): TenantState => ({
    tenant: null,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Check if current tenant is the default platform tenant
     */
    isDefaultTenant: (state): boolean => {
      return state.tenant?.domain === 'aabenforms.dk' ||
             state.tenant?.domain === 'localhost' ||
             state.tenant?.domain === '127.0.0.1'
    },

    /**
     * Get primary color for theming
     */
    primaryColor: (state): string => {
      return state.tenant?.primaryColor || '#007acc'
    },

    /**
     * Get secondary color for theming
     */
    secondaryColor: (state): string => {
      return state.tenant?.secondaryColor || '#28a745'
    },

    /**
     * Get tenant logo URL
     */
    logoUrl: (state): string | null => {
      return state.tenant?.logo || null
    },

    /**
     * Get tenant name for display
     */
    tenantName: (state): string => {
      return state.tenant?.name || 'ÅbenForms'
    },

    /**
     * Check if MitID is enabled for this tenant
     */
    isMitIdEnabled: (state): boolean => {
      return state.tenant?.settings?.enableMitId !== false
    }
  },

  actions: {
    /**
     * Detect tenant from current domain
     */
    async detectTenant() {
      if (!process.client) return

      this.loading = true
      this.error = null

      try {
        const hostname = window.location.hostname
        const config = useRuntimeConfig()

        // Fetch domain configuration from Drupal
        const { fetchResource } = useApi()
        const response = await fetchResource('domain/domain', {
          params: {
            'filter[hostname]': hostname
          }
        })

        if (response.data && response.data.length > 0) {
          const domainData = response.data[0] as DomainRecord
          this.tenant = this.mapDomainToTenant(domainData)

          // Persist to localStorage
          localStorage.setItem('tenant_data', JSON.stringify(this.tenant))

          // Apply branding
          this.applyBranding()
        } else {
          // No matching domain, use default
          this.setDefaultTenant()
        }
      } catch (error) {
        console.error('Failed to detect tenant:', error)
        this.error = 'Failed to load tenant configuration'

        // Try to load from localStorage cache
        this.loadFromCache()
      } finally {
        this.loading = false
      }
    },

    /**
     * Map Drupal domain record to Tenant type
     */
    mapDomainToTenant(domainData: DomainRecord): Tenant {
      return {
        name: domainData.attributes.name,
        domain: domainData.attributes.hostname,
        logo: domainData.attributes.logo_url,
        primaryColor: domainData.attributes.primary_color || '#007acc',
        secondaryColor: domainData.attributes.secondary_color || '#28a745',
        settings: {
          ...domainData.attributes.third_party_settings,
          enableMitId: domainData.attributes.third_party_settings?.aabenforms?.enable_mitid !== false,
          defaultLanguage: domainData.attributes.third_party_settings?.aabenforms?.default_language || 'da',
          timezone: domainData.attributes.third_party_settings?.aabenforms?.timezone || 'Europe/Copenhagen'
        }
      }
    },

    /**
     * Set default tenant (ÅbenForms platform)
     */
    setDefaultTenant() {
      this.tenant = {
        name: 'ÅbenForms',
        domain: window.location.hostname,
        primaryColor: '#007acc',
        secondaryColor: '#28a745',
        settings: {
          enableMitId: true,
          defaultLanguage: 'da',
          timezone: 'Europe/Copenhagen'
        }
      }

      this.applyBranding()
    },

    /**
     * Load tenant from localStorage cache
     */
    loadFromCache() {
      if (!process.client) return

      const cached = localStorage.getItem('tenant_data')
      if (cached) {
        try {
          this.tenant = JSON.parse(cached)
          this.applyBranding()
        } catch (error) {
          console.error('Failed to parse cached tenant data:', error)
          this.setDefaultTenant()
        }
      } else {
        this.setDefaultTenant()
      }
    },

    /**
     * Apply tenant branding to CSS custom properties
     */
    applyBranding() {
      if (!process.client || !this.tenant) return

      const root = document.documentElement

      // Set CSS custom properties
      root.style.setProperty('--color-primary', this.tenant.primaryColor || '#007acc')
      root.style.setProperty('--color-secondary', this.tenant.secondaryColor || '#28a745')

      // Generate lighter/darker variants
      const primary = this.tenant.primaryColor || '#007acc'
      const secondary = this.tenant.secondaryColor || '#28a745'

      root.style.setProperty('--color-primary-light', this.lightenColor(primary, 20))
      root.style.setProperty('--color-primary-dark', this.darkenColor(primary, 20))
      root.style.setProperty('--color-secondary-light', this.lightenColor(secondary, 20))
      root.style.setProperty('--color-secondary-dark', this.darkenColor(secondary, 20))
    },

    /**
     * Lighten a hex color by percentage
     */
    lightenColor(color: string, percent: number): string {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = Math.min(255, (num >> 16) + amt)
      const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
      const B = Math.min(255, (num & 0x0000ff) + amt)
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
    },

    /**
     * Darken a hex color by percentage
     */
    darkenColor(color: string, percent: number): string {
      const num = parseInt(color.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = Math.max(0, (num >> 16) - amt)
      const G = Math.max(0, ((num >> 8) & 0x00ff) - amt)
      const B = Math.max(0, (num & 0x0000ff) - amt)
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
    },

    /**
     * Update tenant settings
     */
    updateSettings(settings: Partial<Tenant['settings']>) {
      if (this.tenant) {
        this.tenant.settings = {
          ...this.tenant.settings,
          ...settings
        }

        // Persist to localStorage
        if (process.client) {
          localStorage.setItem('tenant_data', JSON.stringify(this.tenant))
        }
      }
    },

    /**
     * Clear tenant state
     */
    clearTenant() {
      this.tenant = null
      this.error = null

      if (process.client) {
        localStorage.removeItem('tenant_data')
      }
    }
  }
})
