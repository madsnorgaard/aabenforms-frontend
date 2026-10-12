/**
 * Logs the citizen out. Fails closed: the cookie is cleared whatever Drupal
 * answers.
 *
 * idpLogout (default true): Drupal's RP-initiated logout revokes the session
 * and answers with a redirect to the IdP's end_session endpoint, carrying the
 * id_token_hint it keeps server-side. Nitro makes that call with the cookie's
 * id and hands the browser only the redirect target. Without the hint
 * Keycloak stops on its own confirmation page, and on a shared device the
 * next person must not be offered the previous person's login.
 *
 * idpLogout false: the session is only revoked.
 */
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ idpLogout?: unknown, returnPath?: unknown }>(event).catch(() => null)
  const idpLogout = body?.idpLogout !== false
  const path = typeof body?.returnPath === 'string' && body.returnPath.startsWith('/') && !body.returnPath.startsWith('//')
    ? body.returnPath
    : '/'
  const returnUrl = `${getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin}${path}`

  const session = readSessionId(event)
  clearSessionCookie(event)
  setResponseHeader(event, 'Cache-Control', 'no-store, private')

  const publicLogout = `${useRuntimeConfig().public.apiBase}/mitid/logout?return_url=${encodeURIComponent(returnUrl)}`

  if (!idpLogout) {
    if (session) {
      await drupalFetch(event, '/api/mitid/session/revoke', { method: 'POST', body: { session_id: session } }).catch(() => null)
      setResponseStatus(event, 200)
    }
    return { redirect: null }
  }

  if (!session) {
    // Nothing to revoke here; the backend still ends any IdP session bound to
    // the browser's Drupal session.
    return { redirect: publicLogout }
  }

  const { base, headers } = drupalRequestTarget(event)
  try {
    const res = await fetch(`${base}/mitid/logout?return_url=${encodeURIComponent(returnUrl)}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ session_id: session }),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })
    const location = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && location && /^https?:\/\//i.test(location)) {
      return { redirect: location }
    }
  }
  catch (err) {
    console.error('Logout proxy error', err)
  }
  // Fallback: revoke over the API, then let the browser run the backend's
  // logout so the IdP session still ends (it may ask for confirmation).
  await drupalFetch(event, '/api/mitid/session/revoke', { method: 'POST', body: { session_id: session } }).catch(() => null)
  setResponseStatus(event, 200)
  return { redirect: publicLogout }
})
