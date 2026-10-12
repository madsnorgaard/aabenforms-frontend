/**
 * Submits a form for the signed-in citizen.
 *
 * The session is taken from the cookie only: any workflow_id the client sends
 * is removed, and the cookie's id is set where the backend reads it
 * (data.workflow_id). Without a cookie the form is submitted anonymously, and
 * the backend refuses it if a flow behind the form requires MitID.
 */
const WEBFORM_ID = /^[a-z0-9_]{1,64}$/

type Payload = { workflow_id?: unknown, data?: Record<string, unknown> & { workflow_id?: unknown, attributes?: Record<string, unknown> } }

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const webform = getRouterParam(event, 'webform') || ''
  if (!WEBFORM_ID.test(webform)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown form' })
  }
  const body = await readBody<Payload>(event)
  if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') {
    setResponseStatus(event, 400)
    return { error: 'Invalid submission data' }
  }
  delete body.workflow_id
  delete body.data.workflow_id
  if (body.data.attributes && typeof body.data.attributes === 'object') {
    delete body.data.attributes.workflow_id
  }
  const session = readSessionId(event)
  if (session) {
    body.data.workflow_id = session
  }
  return drupalFetch(event, `/api/webform/${webform}/submit`, { method: 'POST', body })
})
