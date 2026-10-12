import { expect, type BrowserContext, type Page } from '@playwright/test'

/**
 * The MitID session lives in an HttpOnly cookie that page JavaScript cannot
 * read (#252). The test harness can, so specs take the id from the cookie
 * jar and then prove the page never sees it.
 */
export const SESSION_COOKIE = '__Host-af_mitid'

/** A MitID workflow id anywhere in a string. */
export const SESSION_ID_PATTERN = /wf_[a-f0-9]{32}/

/** The session id from the browser's cookie jar, or null. */
export async function sessionFromCookie(context: BrowserContext): Promise<string | null> {
  const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE)
  if (!cookie) return null
  expect(cookie.httpOnly, 'session cookie must be HttpOnly').toBe(true)
  expect(cookie.secure, 'session cookie must be Secure').toBe(true)
  expect(cookie.sameSite, 'session cookie must be SameSite=Strict').toBe('Strict')
  return cookie.value
}

/** Nothing page JavaScript can read holds a session id: cookies, storage, URL. */
export async function expectSessionHiddenFromPage(page: Page): Promise<void> {
  const readable = await page.evaluate(() => {
    const values = [document.cookie, window.location.href]
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i) ?? ''
        values.push(`${key}=${store.getItem(key) ?? ''}`)
      }
    }
    return values
  })
  expect(readable.filter((v) => /wf_[a-f0-9]{32}/.test(v))).toEqual([])
}

/**
 * Records every response the page receives whose body contains a session
 * id. Call the returned function at the end and expect an empty list.
 */
export function watchResponsesForSessionIds(page: Page): () => string[] {
  const leaks: string[] = []
  page.on('response', async (res) => {
    const type = res.headers()['content-type'] ?? ''
    if (!/json|text|javascript/.test(type)) return
    try {
      if (SESSION_ID_PATTERN.test(await res.text())) leaks.push(res.url())
    }
    catch {
      // Redirects and aborted requests have no body.
    }
  })
  return () => leaks
}
