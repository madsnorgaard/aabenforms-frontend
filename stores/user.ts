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
 * The MitID session id is a bearer capability, so browser code never holds
 * it (#252): the Nuxt server keeps it in an HttpOnly cookie and the browser
 * calls same-origin routes under /api/session/. Older builds kept the id in
 * sessionStorage or localStorage; those keys are cleared on sight.
 */
const LEGACY_KEYS = ['auth_session_id', 'auth_session_expiry']

function clearLegacyStorage() {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
    catch {
      // Storage can be unavailable (private mode); nothing to clear then.
    }
  }
}

/** A backend expiry (Unix seconds, or an ISO date) as epoch milliseconds. */
function expiryMs(expiry: string | null): number | null {
  if (!expiry) return null
  const ms = /^\d+$/.test(expiry) ? Number(expiry) * 1000 : Date.parse(expiry)
  return Number.isFinite(ms) ? ms : null
}

interface UserState {
  user: User | null
  sessionExpiry: string | null
  isAuthenticated: boolean
  loading: boolean
}

/** One in-flight restore shared by every caller on a page load. */
let restoring: Promise<void> | null = null

/**
 * User store for managing authentication state
 * Replaces the useState pattern in useAuth composable
 */
export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
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
      const ms = expiryMs(state.sessionExpiry)
      return ms !== null && ms < Date.now()
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
    setUser(user: User, sessionExpiry?: string | number) {
      this.user = user
      this.sessionExpiry = sessionExpiry != null && sessionExpiry !== '' ? String(sessionExpiry) : null
      this.isAuthenticated = true
    },

    /**
     * Load the signed-in citizen from the session cookie. The cookie is
     * HttpOnly, so only the server knows whether there is one.
     */
    async loadSession() {
      this.loading = true
      try {
        const response = await $fetch<{ data: { attributes: SessionAttributes } | null }>('/api/session/me', {
          headers: { Accept: 'application/json' },
        })
        const a = response?.data?.attributes
        if (a) {
          this.setUser(sessionUserFromAttributes(a), a.expiry)
        }
        else {
          this.clearSession()
        }
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
     * Restore the session on page load. Concurrent callers share one request.
     */
    restoreSession(): Promise<void> {
      if (!import.meta.client) return Promise.resolve()
      clearLegacyStorage()
      if (this.isAuthenticated && !this.isSessionExpired) return Promise.resolve()
      restoring ??= this.loadSession().finally(() => {
        restoring = null
      })
      return restoring
    },

    /**
     * Clear authentication state
     */
    clearSession() {
      this.user = null
      this.sessionExpiry = null
      this.isAuthenticated = false

      if (import.meta.client) {
        clearLegacyStorage()
      }
    },

    /**
     * Logout user.
     *
     * Fails closed: local state is cleared first and always, whatever the
     * network does. The server clears the session cookie and, unless
     * idpLogout is false, returns the IdP logout URL: the backend revoked the
     * session and hinted the IdP with its id_token, so the IdP session ends
     * too and on a shared device the next person is not offered the previous
     * person's login. With idpLogout false the session is only revoked.
     *
     * @param options.idpLogout  End the IdP session too (default true).
     * @param options.returnPath Frontend path to land on afterwards (default '/').
     */
    async logout(options: { idpLogout?: boolean, returnPath?: string } = {}) {
      this.clearSession()
      if (!import.meta.client) return

      const idpLogout = options.idpLogout !== false
      const returnPath = options.returnPath && options.returnPath.startsWith('/') && !options.returnPath.startsWith('//')
        ? options.returnPath
        : '/'

      let redirect: string | null = null
      try {
        const res = await $fetch<{ redirect: string | null }>('/api/session/logout', {
          method: 'POST',
          body: { idpLogout, returnPath },
          timeout: 10000,
        })
        redirect = res?.redirect ?? null
      }
      catch {
        // Local state is already gone; the session expires anyway.
      }

      if (idpLogout) {
        // No answer: still run the backend logout so the IdP session ends.
        const fallback = `${useRuntimeConfig().public.apiBase}/mitid/logout?return_url=${encodeURIComponent(window.location.origin + returnPath)}`
        window.location.assign(redirect || fallback)
      }
    }
  }
})
