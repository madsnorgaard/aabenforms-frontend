/**
 * User data from MitID authentication
 */
export interface User {
  /**
   * Danish CPR number (10 digits)
   * Stored encrypted in backend
   */
  cpr: string

  /**
   * User's full name
   */
  name: string

  /**
   * Email address (if available from MitID)
   */
  email?: string

  /**
   * Session expiry timestamp (ISO 8601)
   */
  sessionExpiry?: string
}

/**
 * MitID session data from backend
 */
export interface MitIdSession {
  /**
   * Session ID (UUID)
   */
  id: string

  /**
   * CPR number
   */
  cpr: string

  /**
   * User name
   */
  name?: string

  /**
   * Email address
   */
  email?: string

  /**
   * Session creation timestamp
   */
  created: string

  /**
   * Session expiry timestamp
   */
  expiry: string

  /**
   * Authentication method (mitid_flow, mitid_token)
   */
  authMethod: string
}
