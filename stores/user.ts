import { defineStore } from 'pinia'
import type { User } from '~/types/user'

/** Public session attributes from the backend (CPR always masked). */
export interface SessionAttributes {
  name: string
  cpr: string
  email: string
  expiry: string
  given_name?: string
  family_name?: string
  birthdate?: string
  assurance_level?: string
  address?: {
    street?: string | null
    postal_code?: string | null
    city?: string | null
    municipality_code?: string | null
  } | null
}

/** Maps the backend's public session attributes to the app's User. */
export function sessionUserFromAttributes(a: SessionAttributes): User {
  return {
    cpr: a.cpr,
    name: a.name || '',
    email: a.email || '',
    sessionExpiry: a.expiry,
    given_name: a.given_name || undefined,
    family_name: a.family_name || undefined,
    birthdate: a.birthdate || undefined,
    assurance_level: a.assurance_level || undefined,
    address: a.address || null,
  }
}

/**
 * The session id is a bearer capability. It lives in sessionStorage: scoped
 * to this tab and gone when the tab closes, never shared across a shared
 * device's later visitors. Older builds used localStorage; those keys are
 * cleared on sight.
 */
const SESSION_KEY = 'auth_session_id'
const EXPIRY_KEY = 'auth_session_expiry'

function clearLegacyStorage() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

interface UserState {
  user: User | null
  sessionId: string | null
  sessionExpiry: string | null
  isAuthenticated: boolean
  loading: boolean
}

/**
 * User store for managing authentication state
 * Replaces the useState pattern in useAuth composable
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    sessionId: null,
    sessionExpiry: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    /**
     * Get masked CPR for display (DDMMYY-****)
     */
    maskedCpr: (state): string | null => {
      if (!state.user?.cpr) return null
      const cpr = state.user.cpr.replace(/[\s-]/g, '')
      return `${cpr.substring(0, 6)}-****`
    },

    /**
     * Check if session is expired
     */
    isSessionExpired: (state): boolean => {
      if (!state.sessionExpiry) return false
      return new Date(state.sessionExpiry) < new Date()
    },

    /**
     * Get user display name
     */
    displayName: (state): string => {
      return state.user?.name || 'Unknown User'
    }
  },

  actions: {
    /**
     * Set user from MitID authentication
     */
    setUser(user: User, sessionId: string, sessionExpiry?: string) {
      this.user = user
      this.sessionId = sessionId
      this.sessionExpiry = sessionExpiry || null
      this.isAuthenticated = true

      // Persist for this tab only
      if (process.client) {
        sessionStorage.setItem(SESSION_KEY, sessionId)
        if (sessionExpiry) {
          sessionStorage.setItem(EXPIRY_KEY, sessionExpiry)
        }
      }
    },

    /**
     * Reload the user for a session id (page reload restore).
     *
     * GET /api/mitid/session with the id in the Authorization header, never
     * in the URL (#156).
     */
    async loadSession(sessionId: string) {
      this.loading = true
      const config = useRuntimeConfig()

      try {
        const response = await $fetch<{ data: { attributes: SessionAttributes } }>(`${config.public.apiBase}/api/mitid/session`, {
          method: 'GET',
          headers: { Accept: 'application/json', Authorization: `Bearer ${sessionId}` },
        })

        if (!response?.data) {
          throw new Error('Invalid session response')
        }

        const a = response.data.attributes
        this.setUser(sessionUserFromAttributes(a), sessionId, a.expiry)
      }
      catch (error) {
        console.error('Failed to load session:', error)
        this.clearSession()
      }
      finally {
        this.loading = false
      }
    },

    /**
     * Restore this tab's session
     */
    restoreSession() {
      if (!process.client) return

      clearLegacyStorage()
      const sessionId = sessionStorage.getItem(SESSION_KEY)
      const sessionExpiry = sessionStorage.getItem(EXPIRY_KEY)

      if (sessionId) {
        this.sessionId = sessionId
        this.sessionExpiry = sessionExpiry

        // Check if expired
        if (this.isSessionExpired) {
          this.clearSession()
          return
        }

        // Load full user data from backend
        this.loadSession(sessionId)
      }
    },

    /**
     * Clear authentication state
     */
    clearSession() {
      this.user = null
      this.sessionId = null
      this.sessionExpiry = null
      this.isAuthenticated = false

      if (process.client) {
        sessionStorage.removeItem(SESSION_KEY)
        sessionStorage.removeItem(EXPIRY_KEY)
        clearLegacyStorage()
      }
    },

    /**
     * Logout user.
     *
     * Fails closed: local state is cleared first and always, whatever the
     * network does. Then, unless idpLogout is false, the browser POSTs the
     * session id (in the body, never the URL) to the backend's RP-initiated
     * logout, which revokes it and ends the IdP session too - on a shared
     * device the next person must not be offered the previous person's login.
     * With idpLogout false the session is only revoked over XHR.
     *
     * @param options.idpLogout  End the IdP session too (default true).
     * @param options.returnPath Frontend path to land on afterwards (default '/').
     */
    async logout(options: { idpLogout?: boolean, returnPath?: string } = {}) {
      const config = useRuntimeConfig()
      const sessionId = this.sessionId

      this.clearSession()

      const idpLogout = options.idpLogout !== false && import.meta.client

      // Without IdP logout, revoke the session over XHR. With it, the logout
      // POST below revokes it and uses its id_token as id_token_hint.
      if (sessionId && !idpLogout) {
        try {
          await $fetch(`${config.public.apiBase}/api/mitid/session/revoke`, {
            method: 'POST',
            body: { session_id: sessionId },
            timeout: 5000,
          })
        }
        catch {
          // Ignored: local state is already gone; the session expires anyway.
        }
      }

      if (idpLogout) {
        const path = options.returnPath && options.returnPath.startsWith('/') && !options.returnPath.startsWith('//')
          ? options.returnPath
          : '/'
        const returnUrl = `${window.location.origin}${path}`
        const action = `${config.public.apiBase}/mitid/logout?return_url=${encodeURIComponent(returnUrl)}`
        if (!sessionId) {
          window.location.assign(action)
          return
        }
        // A top-level form POST, so the session id travels in the body, never
        // the URL. The backend revokes it and hints the IdP with its id_token;
        // without the hint Keycloak stops on its own logout confirmation.
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = action
        form.style.display = 'none'
        const field = document.createElement('input')
        field.type = 'hidden'
        field.name = 'session_id'
        field.value = sessionId
        form.appendChild(field)
        document.body.appendChild(form)
        form.submit()
      }
    }
  }
})
