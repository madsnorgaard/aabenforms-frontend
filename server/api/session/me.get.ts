/**
 * The signed-in citizen's public session attributes, or `data: null`.
 *
 * Every page load asks, so "not signed in" is a normal 200 rather than an
 * error. Without a cookie Drupal is not called at all, so anonymous visits
 * add no audit noise; an expired session clears the cookie.
 */
interface SessionResponse {
  data?: { type: string, id: string, attributes: Record<string, unknown> }
}

export default defineEventHandler(async (event) => {
  const session = readSessionId(event)
  setResponseHeader(event, 'Cache-Control', 'no-store, private')
  if (!session) {
    return { data: null }
  }
  const res = await drupalFetch<SessionResponse>(event, '/api/mitid/session', { session })
  if (!res?.data?.attributes) {
    setResponseStatus(event, 200)
    return { data: null }
  }
  return { data: { type: res.data.type, attributes: res.data.attributes } }
})
