import type { H3Event } from 'h3'
import { FetchError, ofetch } from 'ofetch'

/**
 * The MitID session as an HttpOnly cookie on the frontend origin (#252).
 *
 * The session id is a bearer capability. Browser JavaScript never sees it:
 * the routes under server/api/session/ keep it in this cookie and call
 * Drupal with "Authorization: Bearer <id>", the backend's contract for
 * server-side callers. `__Host-` means Secure, Path=/ and no Domain, so no
 * subdomain can set or read it.
 */
export const SESSION_COOKIE = '__Host-af_mitid'

/** Same shape the backend accepts (aabenforms_core SessionBearer). */
const SESSION_ID = /^[A-Za-z0-9_.-]{8,200}$/

/** The backend's MitID session lifetime, used when no expiry is given. */
const DEFAULT_TTL_SECONDS = 900

/** The session id from the cookie, or null. */
export function readSessionId(event: H3Event): string | null {
  const id = getCookie(event, SESSION_COOKIE)
  return id && SESSION_ID.test(id) ? id : null
}

/**
 * Seconds until a backend expiry (Unix seconds, or an ISO date), clamped to
 * the session lifetime so a bad value cannot make the cookie outlive it.
 */
function secondsUntil(expiry: unknown): number {
  const raw = typeof expiry === 'number' || /^\d+$/.test(String(expiry ?? ''))
    ? Number(expiry) * 1000
    : Date.parse(String(expiry ?? ''))
  if (!Number.isFinite(raw)) return DEFAULT_TTL_SECONDS
  const seconds = Math.floor((raw - Date.now()) / 1000)
  return Math.max(0, Math.min(seconds, DEFAULT_TTL_SECONDS))
}

export function setSessionCookie(event: H3Event, id: string, expiry: unknown): void {
  setCookie(event, SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: secondsUntil(expiry),
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' })
}

/**
 * CSRF guard for state-changing routes. SameSite=Strict already keeps the
 * cookie off cross-site requests; this also refuses any request a browser
 * marks as cross-origin.
 */
export function assertSameOrigin(event: H3Event): void {
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site && site !== 'same-origin') {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request rejected' })
  }
  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    let originHost = ''
    try {
      originHost = new URL(origin).host
    }
    catch {
      // A malformed Origin is treated as foreign.
    }
    if (originHost !== getRequestHost(event, { xForwardedHost: true })) {
      throw createError({ statusCode: 403, statusMessage: 'Cross-origin request rejected' })
    }
  }
}

/**
 * Where Nitro reaches Drupal, and the headers that keep the citizen visible.
 *
 * With NUXT_API_INTERNAL_BASE set (production: http://aabenforms_drupal on
 * the shared docker network) the request skips the public proxy, so Drupal,
 * which trusts its direct caller as a reverse proxy, takes the citizen's IP
 * from X-Forwarded-For for rate limits and the audit log. Through the public
 * proxy every citizen would share Nitro's IP. X-Forwarded-Host carries the
 * public API host because fetch() does not let a caller set Host.
 */
function drupalTarget(event: H3Event): { base: string, headers: Record<string, string> } {
  const config = useRuntimeConfig()
  const publicBase = String(config.public.apiBase)
  const internalBase = String(config.apiInternalBase || '')
  const headers: Record<string, string> = { Accept: 'application/json' }
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (ip) headers['X-Forwarded-For'] = ip
  if (internalBase) {
    const url = new URL(publicBase)
    headers['X-Forwarded-Host'] = url.host
    headers['X-Forwarded-Proto'] = url.protocol.replace(':', '')
  }
  return { base: internalBase || publicBase, headers }
}

export interface DrupalCall {
  method?: 'GET' | 'POST'
  query?: Record<string, string>
  body?: unknown
  /** Send the cookie's session as the Bearer token. */
  session?: string | null
}

/**
 * Calls Drupal for the browser. Drupal's status and JSON body are passed
 * through unchanged, errors included; a network failure becomes a 502. A 401
 * means the session is gone, so the cookie is cleared.
 */
export async function drupalFetch<T>(event: H3Event, path: string, call: DrupalCall = {}): Promise<T> {
  const { base, headers } = drupalTarget(event)
  if (call.session) headers.Authorization = `Bearer ${call.session}`
  setResponseHeader(event, 'Cache-Control', 'no-store, private')
  try {
    return await ofetch<T>(`${base}${path}`, {
      method: call.method ?? 'GET',
      query: call.query,
      body: call.body as Record<string, unknown> | undefined,
      headers,
      timeout: 30000,
    })
  }
  catch (err) {
    if (err instanceof FetchError && err.response) {
      if (err.response.status === 401) clearSessionCookie(event)
      // Same status and body as a direct call, so callers read errors as before.
      setResponseStatus(event, err.response.status)
      return err.data as T
    }
    console.error('Drupal session proxy error', path, err)
    throw createError({ statusCode: 502, statusMessage: 'Backend unavailable' })
  }
}

/** The Drupal base and forwarding headers, for calls that need the raw response. */
export function drupalRequestTarget(event: H3Event) {
  return drupalTarget(event)
}
