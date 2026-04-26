/**
 * User data from MitID authentication.
 *
 * The required block (cpr/name) is what real MitID + NemLog-in always issue.
 * The optional address/birthdate/given_name/family_name/assurance_level keys
 * are extras populated by the demo Keycloak (mock IdP) and used by the
 * Byggetilladelse demo to prefill the application form. Real production IdPs
 * may leave most of these absent - consumers should treat them as truly
 * optional and fall back to manual entry.
 */
export interface User {
  cpr: string
  name: string
  email?: string
  sessionExpiry?: string

  given_name?: string
  family_name?: string
  birthdate?: string
  address?: UserAddress | null
  assurance_level?: string
}

export interface UserAddress {
  street?: string | null
  postal_code?: string | null
  city?: string | null
  municipality_code?: string | null
}

/**
 * MitID session data from backend.
 */
export interface MitIdSession {
  id: string
  cpr: string
  name?: string
  email?: string
  created: string
  expiry: string
  authMethod: string
}
