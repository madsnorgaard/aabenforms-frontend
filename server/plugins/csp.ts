/**
 * Content-Security-Policy for every server-rendered HTML response.
 *
 * Nuxt emits exactly one inline script per page, the runtime config in
 * `window.__NUXT__`. Its SHA-256 is added to `script-src`, so the policy
 * needs neither 'unsafe-inline' nor a nonce. Everything else the pages load
 * is self-hosted (DKFDS CSS and JS, IBM Plex Sans, the icon sprite).
 *
 * Cross-origin targets come from runtime config: the Drupal API for fetch
 * and form posts, and the statistics script that plugins/consent.client.ts
 * injects after cookie consent, when one is configured.
 *
 * The hook only runs for pages rendered on the server, which is why
 * nuxt.config.ts serves pages with stale-while-revalidate instead of
 * prerendering them at build time.
 */
import { createHash } from 'node:crypto'

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const NON_EXECUTABLE_TYPE = /\btype\s*=\s*["']?(application\/(ld\+)?json|text\/(template|x-template|html|plain))\b/i

function originOf(value: unknown): string {
  if (!value) return ''
  try {
    return new URL(String(value)).origin
  } catch {
    return ''
  }
}

function inlineScriptHashes(parts: string[][]): string[] {
  const hashes = new Set<string>()
  for (const part of parts) {
    for (const chunk of part) {
      for (const match of chunk.matchAll(INLINE_SCRIPT)) {
        const [, attrs, body] = match
        if (/\bsrc\s*=/i.test(attrs) || NON_EXECUTABLE_TYPE.test(attrs) || !body.trim()) continue
        hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
      }
    }
  }
  return [...hashes]
}

const join = (...sources: string[]) => sources.filter(Boolean).join(' ')

export default defineNitroPlugin((nitroApp) => {
  // The dev server needs Vite's inline client and HMR socket; the policy is
  // for built output only.
  if (import.meta.dev) return

  const config = useRuntimeConfig()
  const apiOrigin = originOf(config.public.apiBase)
  const analyticsOrigin = originOf(config.public.analyticsScript)

  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const hashes = inlineScriptHashes([html.head, html.bodyPrepend, html.body, html.bodyAppend])
    const directives = [
      "default-src 'self'",
      `script-src ${join("'self'", ...hashes, analyticsOrigin)}`,
      // Stylesheets and <style> stay self-hosted. Vue binds a few style
      // attributes at runtime (progress width, skeleton size), and DKFDS
      // toggles some, so attributes are allowed while elements are not.
      "style-src 'self'",
      "style-src-attr 'unsafe-inline'",
      `img-src ${join("'self'", 'data:', 'blob:', apiOrigin)}`,
      "font-src 'self'",
      `connect-src ${join("'self'", apiOrigin, analyticsOrigin)}`,
      "frame-src 'none'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      `form-action ${join("'self'", apiOrigin)}`,
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ]
    if (getRequestProtocol(event) === 'https') {
      directives.push('upgrade-insecure-requests')
    }
    setResponseHeader(event, 'Content-Security-Policy', directives.join('; '))
  })
})
