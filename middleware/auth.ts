/**
 * Authentication middleware for protected routes.
 *
 * Usage in pages:
 *   definePageMeta({ middleware: 'auth' })
 *
 * Checks if user is authenticated and redirects to login if not.
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated, restoreSession, isSessionExpired } = useAuth()

  // Try to restore session from localStorage on first access
  if (!isAuthenticated.value && process.client) {
    restoreSession()
  }

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    // Store intended destination for redirect after login
    if (process.client) {
      sessionStorage.setItem('mitid_return_url', to.fullPath)
    }

    // Redirect to home with message
    return navigateTo('/?auth=required')
  }

  // Check if session is expired
  if (isSessionExpired()) {
    // Clear expired session and redirect
    if (process.client) {
      const { clearSession } = useAuth()
      clearSession()
      sessionStorage.setItem('mitid_return_url', to.fullPath)
    }

    return navigateTo('/?auth=expired')
  }

  // User is authenticated and session is valid
})
