/**
 * Address search client for the Klimadatastyrelsen Adressevælger service
 * (the successor to DAWA, which is decommissioned 17 August 2026).
 *
 * This is a framework-agnostic, dependency-free implementation of the upstream
 * library's API contract (github.com/Klimadatastyrelsen/adressevaelger), routed
 * through our own server proxy (`/api/adressevaelger`) so the access token stays
 * server-side. It powers the accessible <AddressAutocomplete> combobox.
 *
 * Feature parity with DAWA autocomplete: full (non-fuzzy) prefix/substring search,
 * stepwise narrowing (street -> postal district -> house number), and a normalized
 * selected address. Optional municipality scoping, access-address-only mode,
 * provisional addresses and a result cap mirror the upstream options.
 */

/** A single suggestion returned by `/{endpoint}/soeg`. */
export interface AddressSuggestion {
  /** Human-readable label to display in the list. */
  titel: string
  /** Suggestion kind: `vejnavn` | `navngivenvejpostnummer` | `husnummer` | address types. */
  type: string
  /** Identifier used to either narrow the search or look up the full record. */
  id: string
}

/** ETRS89 / EPSG:25832 coordinates (the CRS the service returns). */
export interface AddressCoordinates {
  x: number
  y: number
}

/** Stable, UI-friendly address shape produced from a by-id lookup. */
export interface NormalizedAddress {
  id: string
  street: string
  postal_code: string
  city: string
  coordinates: AddressCoordinates | null
  /** The untouched upstream record, for callers that need extra fields. */
  raw: unknown
}

export interface UseAddressSearchOptions {
  /** Search access addresses (house numbers) only, instead of full addresses. */
  adgangsadresserOnly?: boolean
  /** Restrict results to a municipality (4-digit kommunekode). */
  kommuneKode?: string
  /** Maximum number of suggestions. */
  maksimum?: number
  /** Include provisional ("foreløbige") addresses. */
  medtagForeloebige?: boolean
  /** Proxy base path. Defaults to the in-app Nuxt proxy route. */
  proxyBase?: string
}

// Suggestion types that refine the query rather than resolve to an address.
const NARROWING_TYPES = new Set(['vejnavn', 'navngivenvejpostnummer'])

export function useAddressSearch(options: UseAddressSearchOptions = {}) {
  const endpoint = options.adgangsadresserOnly ? 'husnumre' : 'adresser'
  const base = (options.proxyBase ?? '/api/adressevaelger').replace(/\/$/, '')

  function buildSearchParams(text: string): Record<string, string> {
    const params: Record<string, string> = { tekst: text }
    if (options.kommuneKode) params.kommuneKode = options.kommuneKode
    if (options.maksimum) params.maksimum = String(options.maksimum)
    if (options.medtagForeloebige) params.medtagForeloebige = 'true'
    return params
  }

  /** Fetch suggestions for the given text. */
  async function search(text: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
    const res = await $fetch<{ fund?: AddressSuggestion[] }>(`${base}/${endpoint}/soeg`, {
      params: buildSearchParams(text),
      signal,
    })
    return Array.isArray(res?.fund) ? res.fund : []
  }

  /** Look up the full record behind a resolved suggestion. */
  async function get(id: string, signal?: AbortSignal): Promise<unknown> {
    return $fetch(`${base}/${endpoint}/${encodeURIComponent(id)}`, { signal })
  }

  /**
   * Whether a suggestion resolves to a final address (true) or only narrows the
   * search (false). Street names and named-street/postcode entries always narrow;
   * a bare house number narrows only when searching full addresses.
   */
  function isFinal(suggestion: AddressSuggestion): boolean {
    if (NARROWING_TYPES.has(suggestion.type)) return false
    if (suggestion.type === 'husnummer' && endpoint === 'adresser') return false
    return true
  }

  return { endpoint, search, get, isFinal, normalizeAddress }
}

/**
 * Map an Adressevælger by-id record to a {@link NormalizedAddress}.
 *
 * Handles both an `adresse` lookup (`{ adresse: { husnummer: {...} } }`) and an
 * access-address lookup (`{ husnummer: {...} }`), preferring structured fields and
 * falling back to the formatted "betegnelse" string when a field is absent.
 * The exact upstream record shape is documented but should be re-confirmed against
 * a live response; the mapping is intentionally isolated so a field rename is a
 * one-line change.
 */
export function normalizeAddress(record: any): NormalizedAddress {
  const adresse = record?.adresse ?? null
  const hus = record?.husnummer ?? adresse?.husnummer ?? null

  const id: string = adresse?.id_lokalid ?? hus?.id_lokalid ?? record?.id_lokalid ?? ''
  const vejnavn: string = hus?.vejnavn ?? ''
  const husnr: string = hus?.husnummertekst ?? ''
  const etage: string | null = adresse?.etagebetegnelse ?? null
  const doer: string | null = adresse?.doerbetegnelse ?? null
  const postalCode: string = hus?.postnummer?.postnr ?? ''
  const city: string = hus?.postnummer?.navn ?? ''

  const streetFromFields = [
    [vejnavn, husnr].filter(Boolean).join(' '),
    etage ? `${etage}.` : '',
    doer || '',
  ].filter(Boolean).join(' ').trim()

  // Fallback: derive the street line from the full "betegnelse" by dropping the
  // trailing ", <postnr> <city>" segment.
  const betegnelse: string = adresse?.adressebetegnelse ?? hus?.adgangsadressebetegnelse ?? ''
  const streetFromBetegnelse = postalCode
    ? betegnelse.split(new RegExp(`,?\\s*${postalCode}\\b`))[0]?.trim() ?? betegnelse
    : betegnelse

  const street = streetFromFields || streetFromBetegnelse

  const koord = hus?.adgangspunkt?.koordinater ?? null
  const coordinates: AddressCoordinates | null =
    koord && typeof koord.x === 'number' && typeof koord.y === 'number'
      ? { x: koord.x, y: koord.y }
      : null

  return { id, street, postal_code: postalCode, city, coordinates, raw: record }
}
