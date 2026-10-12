import type { User } from '~/types/user'
import { useUserStore, sessionUserFromAttributes, type SessionAttributes } from '~/stores/user'

/** sessionStorage key for the login verifier (PKCE-style handoff, #156). */
const VERIFIER_KEY = 'af_login_verifier'

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A fresh RFC 7636 verifier: 32 random bytes, base64url (43 chars). */
function createVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)))
}

/** The S256 challenge for a verifier. */
async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

/**
 * Authentication composable for MitID OIDC integration.
 *
 * Manages user authentication state, login/logout flows,
 * and session management with the Drupal backend.
 *
 * Now uses Pinia user store for centralized state management.
 */
export const useAuth = () => {
  const { apiBase } = useRuntimeConfig().public
  const { fetchResource } = useApi()
  const userStore = useUserStore()

  // Access state from Pinia store
  const user = computed(() => userStore.user)
  const loading = computed(() => userStore.loading)
  const isAuthenticated = computed(() => userStore.isAuthenticated)
  const maskedCpr = computed(() => userStore.maskedCpr)

  // Error state surfaced by the callback page
  const error = ref<string | null>(null)

  /**
   * Initiate MitID login flow
   * Redirects to backend /mitid/login endpoint
   *
   * The session id never comes back in a URL (#156): this tab keeps a secret
   * verifier and sends only its SHA-256 challenge. The callback URL carries a
   * one-time code that is worthless without the verifier.
   */
  async function login(returnUrl?: string, opts: { fresh?: boolean, loginHint?: string } = {}) {
    // Store the intended destination for after auth completes
    if (returnUrl) {
      sessionStorage.setItem('mitid_return_url', returnUrl)
    }

    // Build the auth callback URL on the frontend
    const callbackUrl = `${window.location.origin}/auth/callback`

    // Redirect to backend MitID login, telling it to return to our callback page
    // fresh: force a new MitID sign-in (prompt=login) so the IdP cannot reuse
    // the previous person's session on a shared device.
    const fresh = opts.fresh ? '&fresh=1' : ''
    // loginHint: only a username suggestion for the IdP (OIDC login_hint);
    // the person still authenticates there. The backend validates it.
    const hint = opts.loginHint ? `&login_hint=${encodeURIComponent(opts.loginHint)}` : ''
    const verifier = createVerifier()
    sessionStorage.setItem(VERIFIER_KEY, verifier)
    const challenge = `&client_challenge=${await challengeFor(verifier)}`
    window.location.href = `${apiBase}/mitid/login?return_url=${encodeURIComponent(callbackUrl)}${fresh}${hint}${challenge}`
  }

  /**
   * Handle MitID callback after successful authentication.
   *
   * Redeems the one-time code from the URL with this tab's verifier, then
   * removes the code from the address bar and history.
   */
  async function handleCallback() {
    // Read from the real URL: since Nuxt 3.19, useRoute() in a page returns the
    // page's own (frozen) route, and on the prerendered callback page that
    // route carries no query string during hydration.
    const route = useRoute()
    const code
      = (import.meta.client ? new URLSearchParams(window.location.search).get('code') : null)
        || (route.query.code as string | undefined)
        || undefined
    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    sessionStorage.removeItem(VERIFIER_KEY)
    if (import.meta.client) {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }
    if (!code || !verifier) {
      error.value = 'Missing login code in callback URL'
      return false
    }

    try {
      // Same-origin: the server redeems the code and keeps the session in an
      // HttpOnly cookie. Only the public attributes come back (#252).
      const response = await $fetch<{ data: { attributes: SessionAttributes } }>(
        '/api/session/exchange',
        { method: 'POST', body: { code, code_verifier: verifier }, headers: { Accept: 'application/json' } },
      )
      if (!response?.data?.attributes) {
        throw new Error('Invalid session')
      }
      const user: User = sessionUserFromAttributes(response.data.attributes)
      userStore.setUser(user, response.data.attributes.expiry)

      // Redirect to return URL if stored
      const returnUrl = sessionStorage.getItem('mitid_return_url')
      if (returnUrl) {
        sessionStorage.removeItem('mitid_return_url')
        navigateTo(returnUrl)
      }

      return true
    } catch (e: any) {
      userStore.clearSession()
      console.error('Authentication failed:', e)
      error.value = e?.data?.message || e?.message || 'Could not load MitID session'
      return false
    }
  }

  /**
   * Restore the session (HttpOnly cookie, checked server-side) on page load
   */
  async function restoreSession() {
    await userStore.restoreSession()
  }

  /**
   * Logout user and clear session
   */
  async function logout() {
    // Clears local state, revokes the MitID session and ends the IdP
    // session; the browser lands back on the homepage.
    await userStore.logout({ returnPath: '/' })
  }

  /**
   * Check if session is expired
   */
  function isSessionExpired(): boolean {
    return userStore.isSessionExpired
  }
  return {
    // State (from Pinia store)
    user,
    loading,
    isAuthenticated,
    maskedCpr,
    error,

    // Methods
    login,
    logout,
    handleCallback,
    restoreSession,
    isSessionExpired,
  }
}
