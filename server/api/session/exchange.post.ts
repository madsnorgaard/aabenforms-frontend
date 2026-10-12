/**
 * Redeems the one-time login code (#156) and keeps the session in the
 * HttpOnly cookie. The browser gets the public attributes only, never the id.
 */
interface ExchangeResponse {
  data?: { type: string, id: string, attributes: Record<string, unknown> & { expiry?: unknown } }
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const body = await readBody<{ code?: unknown, code_verifier?: unknown }>(event)
  const res = await drupalFetch<ExchangeResponse>(event, '/api/mitid/session/exchange', {
    method: 'POST',
    body: { code: body?.code, code_verifier: body?.code_verifier },
  })
  if (!res?.data?.id) {
    return res
  }
  setSessionCookie(event, res.data.id, res.data.attributes?.expiry)
  return { data: { type: res.data.type, attributes: res.data.attributes } }
})
