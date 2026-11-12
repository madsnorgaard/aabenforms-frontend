import type { PrefillResponse } from '~/types/demo'

export type PrefillError = 'unauthenticated' | 'not_found' | 'failed' | null

/**
 * GET /api/session/prefill/{webform_id} (same origin; the server adds the
 * MitID session from its HttpOnly cookie and calls the backend's
 * /api/prefill/{webform_id} with it, #252)
 *
 * Runs the register lookups the bound flow would run for the form and returns
 * every value with its provenance (register, contract, honest mode, legal
 * basis, audit id).
 *
 * 401: no or unknown session (expired after 15 min), 404: unknown form.
 */
export const usePrefill = () => {
  const data = ref<PrefillResponse | null>(null)
  const loading = ref(false)
  const error = ref<PrefillError>(null)
  const status = ref<number | null>(null)

  async function load(webformId: string, query: Record<string, string> = {}): Promise<PrefillResponse | null> {
    loading.value = true
    error.value = null
    status.value = null
    try {
      const res = await $fetch<PrefillResponse>(
        `/api/session/prefill/${encodeURIComponent(webformId)}`,
        // query: e.g. { subject: '0' } to act on behalf of someone the session
        // holds a fuldmagt for. Only an index; the backend checks the fuldmagt.
        { headers: { Accept: 'application/json' }, query },
      )
      data.value = res
      status.value = 200
      return res
    }
    catch (e: any) {
      const code = Number(e?.statusCode ?? e?.response?.status ?? 0)
      status.value = code || null
      error.value = code === 401 ? 'unauthenticated' : code === 404 ? 'not_found' : 'failed'
      data.value = null
      console.error('Prefill failed:', e)
      return null
    }
    finally {
      loading.value = false
    }
  }

  function clear() {
    data.value = null
    error.value = null
    status.value = null
  }

  return { data, loading, error, status, load, clear }
}
