import { defineStore } from 'pinia'
import type { User } from '~/types/user'

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

      // Persist to localStorage
      if (process.client) {
        localStorage.setItem('auth_session_id', sessionId)
        if (sessionExpiry) {
          localStorage.setItem('auth_session_expiry', sessionExpiry)
        }
      }
    },

    /**
     * Load user from session ID via the MitID session endpoint.
     *
     * Same endpoint useAuth.loadUserFromSession hits - this path is the
     * page-reload restore (localStorage -> fetch latest claims). The
     * response shape is JSON:API-style with the additive demo fields
     * (given_name/family_name/birthdate/address/assurance_level).
     */
    async loadSession(sessionId: string) {
      this.loading = true
      const config = useRuntimeConfig()

      try {
        const response = await $fetch<{
          data: {
            attributes: {
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
          }
        }>(`${config.public.apiBase}/mitid/session/${sessionId}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        })

        if (!response?.data) {
          throw new Error('Invalid session response')
        }

        const a = response.data.attributes
        const user: User = {
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
        this.setUser(user, sessionId, a.expiry)
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
     * Restore session from localStorage
     */
    restoreSession() {
      if (!process.client) return

      const sessionId = localStorage.getItem('auth_session_id')
      const sessionExpiry = localStorage.getItem('auth_session_expiry')

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
        localStorage.removeItem('auth_session_id')
        localStorage.removeItem('auth_session_expiry')
      }
    },

    /**
     * Logout user.
     *
     * Fails closed: local state is cleared first and always, whatever the
     * network does. Then the MitID session is revoked server-side (the id
     * travels in the POST body, never the URL; errors are ignored) and, unless
     * idpLogout is false, the browser is sent through the backend's
     * RP-initiated logout so the IdP session ends too - on a shared device
     * the next person must not be offered the previous person's login.
     *
     * @param options.idpLogout  End the IdP session too (default true).
     * @param options.returnPath Frontend path to land on afterwards (default '/').
     */
    async logout(options: { idpLogout?: boolean, returnPath?: string } = {}) {
      const config = useRuntimeConfig()
      const sessionId = this.sessionId

      this.clearSession()

      if (sessionId) {
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

      if (options.idpLogout !== false && import.meta.client) {
        const path = options.returnPath && options.returnPath.startsWith('/') && !options.returnPath.startsWith('//')
          ? options.returnPath
          : '/'
        const returnUrl = `${window.location.origin}${path}`
        window.location.assign(`${config.public.apiBase}/mitid/logout?return_url=${encodeURIComponent(returnUrl)}`)
      }
    }
  }
})
