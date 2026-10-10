/**
 * Cookie consent state, backed by the first-party cookie `af_consent`.
 *
 * Values: `accepted` or `rejected`; absent = no choice yet, and the DKFDS
 * cookiemeddelelse (FdsCookieBanner) is shown. The cookie itself is
 * necessary (it only remembers the user's own answer), so it is the one
 * thing we may set without consent. Lifetime 365 days, SameSite=Lax, Secure
 * in production builds.
 *
 * `status` is read from `document.cookie` on the client only. During the
 * server render it is `undefined` ("not read yet") so that prerendered and
 * cached HTML never bakes a consent state in; the banner therefore mounts
 * client-side and only after the cookie has been read.
 *
 * `onAccepted(cb)` runs `cb` once consent is (or already was) given. It is
 * what a statistics script hooks into (see plugins/consent.client.ts), so
 * nothing non-essential is loaded before the user accepts.
 */
export type ConsentStatus = 'accepted' | 'rejected'

export const CONSENT_COOKIE = 'af_consent'
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60

type AcceptedListener = () => void
const acceptedListeners = new Set<AcceptedListener>()

function readConsentCookie(): ConsentStatus | null {
  if (!import.meta.client) return null
  const pair = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${CONSENT_COOKIE}=`))
  const value = pair?.slice(CONSENT_COOKIE.length + 1)
  return value === 'accepted' || value === 'rejected' ? value : null
}

function writeConsentCookie(value: string, maxAge: number) {
  const secure = import.meta.dev ? '' : '; Secure'
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
}

export function useConsent() {
  // undefined = not read yet (server, or before the client setup ran),
  // null = read and no choice stored.
  const status = useState<ConsentStatus | null | undefined>('af-consent', () => undefined)

  if (import.meta.client && status.value === undefined) {
    status.value = readConsentCookie()
  }

  const hasChoice = computed(() => status.value === 'accepted' || status.value === 'rejected')
  const isAccepted = computed(() => status.value === 'accepted')

  function accept() {
    if (!import.meta.client) return
    writeConsentCookie('accepted', CONSENT_MAX_AGE)
    status.value = 'accepted'
    for (const listener of acceptedListeners) {
      try {
        listener()
      } catch (err) {
        console.warn('[consent] onAccepted listener failed', err)
      }
    }
  }

  function reject() {
    if (!import.meta.client) return
    writeConsentCookie('rejected', CONSENT_MAX_AGE)
    status.value = 'rejected'
  }

  /** Forget the stored choice; the banner shows again. */
  function reset() {
    if (!import.meta.client) return
    writeConsentCookie('', 0)
    status.value = null
  }

  /**
   * Run `cb` as soon as consent is given. Fires immediately when the user
   * already accepted, otherwise on the next accept(). Returns an unsubscribe.
   */
  function onAccepted(cb: AcceptedListener): () => void {
    if (import.meta.client && status.value === 'accepted') {
      cb()
    }
    acceptedListeners.add(cb)
    return () => acceptedListeners.delete(cb)
  }

  return { status, hasChoice, isAccepted, accept, reject, reset, onAccepted }
}
