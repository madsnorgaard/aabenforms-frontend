import type { User } from '~/types/user'

/**
 * Authentication composable for MitID OIDC integration.
 *
 * Manages user authentication state, login/logout flows,
 * and session management with the Drupal backend.
 */
export const useAuth = () => {
  const { apiBase } = useRuntimeConfig().public
  const { fetchResource } = useApi()

  // Global user state (persisted across pages)
  const user = useState<User | null>('auth:user', () => null)
  const sessionId = useState<string | null>('auth:sessionId', () => null)
  const loading = useState<boolean>('auth:loading', () => false)
  const error = useState<string | null>('auth:error', () => null)

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => !!user.value && !!sessionId.value)

  /**
   * Initiate MitID login flow
   * Redirects to backend /mitid/login endpoint
   */
  function login(returnUrl?: string) {
    loading.value = true
    error.value = null

    // Store return URL in sessionStorage to redirect after callback
    if (returnUrl) {
      sessionStorage.setItem('mitid_return_url', returnUrl)
    }

    // Redirect to backend MitID login endpoint
    window.location.href = `${apiBase}/mitid/login`
  }

  /**
   * Handle MitID callback after successful authentication
   * Extracts session ID from URL query parameter
   */
  async function handleCallback() {
    const route = useRoute()
    const sessionIdParam = route.query.session as string | undefined

    if (!sessionIdParam) {
      error.value = 'No session ID in callback'
      return false
    }

    try {
      loading.value = true

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
      error.value = e.message || 'Authentication failed'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Load user data from MitID session
   */
  async function loadUserFromSession(sid: string) {
    try {
      // Call backend to get session data
      const response = await fetchResource(`mitid/session/${sid}`)

      if (!response.data) {
        throw new Error('Invalid session')
      }

      const sessionData = response.data.attributes

      // Store session ID
      sessionId.value = sid

      // Store user data
      user.value = {
        cpr: sessionData.cpr,
        name: sessionData.name || '',
        email: sessionData.email || '',
        sessionExpiry: sessionData.expiry,
      }

      // Store in localStorage for persistence
      localStorage.setItem('mitid_session', sid)
      localStorage.setItem('mitid_user', JSON.stringify(user.value))
    } catch (e: any) {
      sessionId.value = null
      user.value = null
      throw e
    }
  }

  /**
   * Restore session from localStorage on page load
   */
  async function restoreSession() {
    const storedSessionId = localStorage.getItem('mitid_session')
    const storedUser = localStorage.getItem('mitid_user')

    if (!storedSessionId || !storedUser) {
      return false
    }

    try {
      loading.value = true

      // Verify session is still valid
      await loadUserFromSession(storedSessionId)

      return true
    } catch (e) {
      // Session expired or invalid, clear storage
      clearSession()
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user and clear session
   */
  async function logout() {
    try {
      loading.value = true

      if (sessionId.value) {
        // Call backend logout endpoint
        await fetchResource(`mitid/logout?session=${sessionId.value}`)
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      clearSession()
      loading.value = false

      // Redirect to homepage
      navigateTo('/')
    }
  }

  /**
   * Clear local session data
   */
  function clearSession() {
    user.value = null
    sessionId.value = null
    error.value = null
    localStorage.removeItem('mitid_session')
    localStorage.removeItem('mitid_user')
  }

  /**
   * Check if session is expired
   */
  function isSessionExpired(): boolean {
    if (!user.value?.sessionExpiry) {
      return true
    }

    const expiry = new Date(user.value.sessionExpiry)
    return expiry < new Date()
  }

  /**
   * Get masked CPR for display (DDMMYY-****)
   */
  const maskedCpr = computed(() => {
    if (!user.value?.cpr) return null

    const cpr = user.value.cpr.replace(/[\s-]/g, '')
    if (cpr.length !== 10) return '******-****'

    return `${cpr.substring(0, 6)}-****`
  })

  return {
    // State
    user: readonly(user),
    sessionId: readonly(sessionId),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    maskedCpr,

    // Methods
    login,
    logout,
    handleCallback,
    restoreSession,
    isSessionExpired,
  }
}
