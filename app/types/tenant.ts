/**
 * Tenant configuration from Drupal Domain module
 */
export interface Tenant {
  /**
   * Tenant display name (e.g., "Aarhus Kommune")
   */
  name: string

  /**
   * Primary domain (e.g., "aarhus.aabenforms.dk")
   */
  domain: string

  /**
   * Logo URL (from Domain module or theme settings)
   */
  logo?: string

  /**
   * Primary brand color (hex)
   */
  primaryColor?: string

  /**
   * Secondary brand color (hex)
   */
  secondaryColor?: string

  /**
   * Custom tenant settings
   * Stored in Domain module's third_party_settings
   */
  settings?: {
    /**
     * Contact email for this tenant
     */
    contactEmail?: string

    /**
     * Support phone number
     */
    supportPhone?: string

    /**
     * Enable MitID authentication
     */
    enableMitId?: boolean

    /**
     * Default language code
     */
    defaultLanguage?: string

    /**
     * Timezone
     */
    timezone?: string

    /**
     * Custom footer text
     */
    footerText?: string

    /**
     * Google Analytics ID
     */
    analyticsId?: string

    /**
     * Additional custom settings
     */
    [key: string]: any
  }
}

/**
 * Domain record from Drupal Domain Access module
 */
export interface DomainRecord {
  id: string
  type: string
  attributes: {
    hostname: string
    name: string
    label?: string
    scheme?: string
    status?: boolean
    weight?: number
    is_default?: boolean
    third_party_settings?: Record<string, any>
    // Theme settings
    logo_url?: string
    theme_logo?: string
    primary_color?: string
    secondary_color?: string
    color_primary?: string
    color_secondary?: string
    // Contact info
    contact_email?: string
    support_phone?: string
    // Feature flags
    enable_mitid?: boolean
    default_language?: string
    timezone?: string
  }
}
