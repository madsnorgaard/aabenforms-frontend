/**
 * The signed-in citizen's latest Digital Post letters (session inbox).
 */
export default defineEventHandler(async (event) => {
  const session = readSessionId(event)
  if (!session) {
    setResponseStatus(event, 401)
    return { error: 'MitID session required' }
  }
  const limit = Number(getQuery(event).limit)
  const query = Number.isInteger(limit) && limit > 0 && limit <= 50 ? { limit: String(limit) } : undefined
  return drupalFetch(event, '/api/digital-post/recent', { session, query })
})
