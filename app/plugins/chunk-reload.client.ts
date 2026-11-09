/**
 * Recover from stale JavaScript chunks after a deploy.
 *
 * Every deploy replaces the hashed files under /_nuxt/. A visitor (or a
 * crawler rendering the page) still holding the previous HTML then asks for
 * a chunk that is gone, and Nuxt would show its error page. Reload once to
 * get the new build instead; the timestamp guard prevents a reload loop when
 * the chunk is missing for another reason.
 */
const KEY = 'af_chunk_reload'
const WINDOW_MS = 30_000

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:chunkError', () => {
    let last = 0
    try {
      last = Number(sessionStorage.getItem(KEY) || 0)
      if (Date.now() - last < WINDOW_MS) return
      sessionStorage.setItem(KEY, String(Date.now()))
    }
    catch {
      // Storage blocked: one plain reload is still better than an error page.
    }
    window.location.reload()
  })
})
