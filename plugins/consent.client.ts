/**
 * Consent plugin: exposes `$consent` (see composables/useConsent.ts) and, when
 * `runtimeConfig.public.analyticsScript` names a script URL, injects that
 * script only after the user has accepted cookies. With the key empty (the
 * default) no statistics script exists and nothing is loaded.
 */
export default defineNuxtPlugin(() => {
  const consent = useConsent()
  const src = String(useRuntimeConfig().public.analyticsScript || '').trim()

  if (src) {
    let injected = false
    consent.onAccepted(() => {
      if (injected || document.querySelector(`script[src="${CSS.escape(src)}"]`)) return
      injected = true
      const script = document.createElement('script')
      script.src = src
      script.async = true
      document.head.appendChild(script)
    })
  }

  return { provide: { consent } }
})
