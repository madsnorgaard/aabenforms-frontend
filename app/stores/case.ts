import { defineStore } from 'pinia'
import type { CaseItem, FristState } from '~/types/case'

/**
 * Coerces a JSON:API date value to a Unix timestamp in seconds.
 *
 * Drupal serialises plain timestamp fields as integers but created/changed as
 * ISO 8601 strings, so accept either.
 */
function toUnixSeconds(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) return parseInt(value, 10)
    const ms = Date.parse(value)
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000)
  }
  return null
}

interface JsonApiResource {
  id: string
  attributes?: Record<string, any>
}

function mapCaseFromApi(resource: JsonApiResource): CaseItem {
  const a = resource.attributes ?? {}
  return {
    id: resource.id,
    title: a.title ?? '',
    caseType: a.case_type ?? '',
    status: a.status ?? 'modtaget',
    fristDue: toUnixSeconds(a.frist_due),
    modtagelsesdato: toUnixSeconds(a.modtagelsesdato),
    created: a.created ?? null,
  }
}

/**
 * Computes the deadline traffic-light state for a case.
 *
 * Mirrors the backend FristClock: red once due, amber within 24h, else green.
 */
export function fristState(fristDue: number | null, nowSeconds: number): FristState {
  if (fristDue === null) return 'none'
  if (nowSeconds >= fristDue) return 'roed'
  if (fristDue - nowSeconds <= 86400) return 'gul'
  return 'groen'
}

export const useCaseStore = defineStore('case', {
  state: () => ({
    cases: [] as CaseItem[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    overdueCount(): number {
      const now = Math.floor(Date.now() / 1000)
      return this.cases.filter(c => fristState(c.fristDue, now) === 'roed').length
    },
  },

  actions: {
    /**
     * Loads cases from the backend JSON:API.
     *
     * @param params Extra JSON:API query params (filters, sort, page).
     */
    async loadCases(params: Record<string, any> = {}) {
      const { fetchResource } = useApi()
      this.loading = true
      this.error = null
      try {
        const response: any = await fetchResource('aabenforms_case/aabenforms_case', {
          params: { sort: '-created', ...params },
          cache: false,
        })
        const data = Array.isArray(response?.data) ? response.data : []
        this.cases = data.map(mapCaseFromApi)
      } catch (e: any) {
        this.error = e?.message ?? 'load_error'
        this.cases = []
      } finally {
        this.loading = false
      }
    },
  },
})
