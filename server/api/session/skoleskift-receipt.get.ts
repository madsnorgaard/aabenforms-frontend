/**
 * The co-signing parent's skoleskift receipt (Lars' page in the demo).
 */
export default defineEventHandler(async (event) => {
  const session = readSessionId(event)
  if (!session) {
    setResponseStatus(event, 401)
    return { error: 'MitID session required' }
  }
  return drupalFetch(event, '/api/skoleskift/medunderskrift', { session })
})
