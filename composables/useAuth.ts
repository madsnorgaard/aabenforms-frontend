import type { User } from '~/types/user'
import { useUserStore } from '~/stores/user'

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
  const sessionId = computed(() => userStore.sessionId)
  const loading = computed(() => userStore.loading)
  const isAuthenticated = computed(() => userStore.isAuthenticated)
  const maskedCpr = computed(() => userStore.maskedCpr)

  /**
   * Initiate MitID login flow
   * Redirects to backend /mitid/login endpoint
   */
  function login(returnUrl?: string) {
    // Store the intended destination for after auth completes
    if (returnUrl) {
      sessionStorage.setItem('mitid_return_url', returnUrl)
    }

    // Build the auth callback URL on the frontend
    const callbackUrl = `${window.location.origin}/auth/callback`

    // Redirect to backend MitID login, telling it to return to our callback page
    window.location.href = `${apiBase}/mitid/login?return_url=${encodeURIComponent(callbackUrl)}`
  }

  /**
   * Handle MitID callback after successful authentication
   * Extracts session ID from URL query parameter
   */
  async function handleCallback() {
    const route = useRoute()
    const sessionIdParam = route.query.session as string | undefined

    if (!sessionIdParam) {
      return false
    }

    try {
      // Fetch user data using session ID
      await loadUserFromSession(sessionIdParam)

      // Redirect to return URL if stored
      const returnUrl = sessionStorage.getItem('mitid_return_url')
      if (returnUrl) {
        sessionStorage.removeItem('mitid_return_url')
        navigateTo(returnUrl)
      }

      return true
    } catch (e: any) {
      console.error('Authentication failed:', e)
      return false
    }
  }

  /**
   * Load user data from MitID session
   */
  async function loadUserFromSession(sid: string) {
    try {
      // Call backend MitID session endpoint directly (not via JSON:API)
      const response = await $fetch<{ data: { attributes: { name: string; cpr: string; email: string; expiry: string } } }>(`${apiBase}/mitid/session/${sid}`, {
        headers: { 'Accept': 'application/json' },
      })

      if (!response.data) {
        throw new Error('Invalid session')
      }

      const sessionData = response.data.attributes

      const userData: User = {
        cpr: sessionData.cpr,
        name: sessionData.name || '',
        email: sessionData.email || '',
        sessionExpiry: sessionData.expiry,
      }

      userStore.setUser(userData, sid, sessionData.expiry)
    } catch (e: any) {
      userStore.clearSession()
      throw e
    }
  }

  /**
   * Restore session from localStorage on page load
   */
  async function restoreSession() {
    userStore.restoreSession()
  }

  /**
   * Logout user and clear session
   */
  async function logout() {
    await userStore.logout()

    // Redirect to homepage
    navigateTo('/')
  }

  /**
   * Check if session is expired
   */
  function isSessionExpired(): boolean {
    return userStore.isSessionExpired
  }

  // Expose error state for callback page
  const error = ref<string | null>(null)

  return {
    // State (from Pinia store)
    user,
    sessionId,
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
