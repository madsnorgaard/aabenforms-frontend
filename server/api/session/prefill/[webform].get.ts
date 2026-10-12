/**
 * Prefill with provenance for a form, for the signed-in citizen.
 * Query: only `subject` (acting on behalf of someone; the backend checks the
 * fuldmagt).
 */
const WEBFORM_ID = /^[a-z0-9_]{1,64}$/

export default defineEventHandler(async (event) => {
  const webform = getRouterParam(event, 'webform') || ''
  if (!WEBFORM_ID.test(webform)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown form' })
  }
  const session = readSessionId(event)
  if (!session) {
    setResponseStatus(event, 401)
    return { error: 'MitID session required' }
  }
  const subject = getQuery(event).subject
  const query = typeof subject === 'string' && /^\d{1,3}$/.test(subject) ? { subject } : undefined
  return drupalFetch(event, `/api/prefill/${webform}`, { session, query })
})
