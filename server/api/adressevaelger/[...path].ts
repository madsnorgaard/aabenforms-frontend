/**
 * Server-side proxy for the Klimadatastyrelsen Adressevælger API.
 *
 * The browser calls `/api/adressevaelger/{adresser|husnumre}/(soeg|{id})` and this
 * handler forwards the request to the upstream service, injecting the access token
 * from private runtime config. The token therefore never ships to the client, and
 * the browser never talks to adressevaelger.dk directly (no CORS dependency).
 *
 * Upstream contract (github.com/Klimadatastyrelsen/adressevaelger src/api.js):
 *   search:  GET {apiUrl}/{endpoint}/soeg?tekst=&token=&[vejnavn|postnummer|kommuneKode|maksimum|medtagForeloebige]
 *   lookup:  GET {apiUrl}/{endpoint}/{id}?token=
 */

const ALLOWED_ENDPOINTS = new Set(['adresser', 'husnumre'])
const ALLOWED_PARAMS = ['tekst', 'vejnavn', 'postnummer', 'kommuneKode', 'maksimum', 'medtagForeloebige']

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const pathParam = getRouterParam(event, 'path') || ''
  const segments = pathParam.split('/').filter(Boolean)
  const endpoint = segments[0]

  if (!ALLOWED_ENDPOINTS.has(endpoint) || segments.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid address request' })
  }

  // Pass through only the recognised query parameters; the token is added server-side
  // and any client-supplied token is ignored.
  const query = getQuery(event)
  const params = new URLSearchParams()
  for (const key of ALLOWED_PARAMS) {
    const value = query[key]
    if (value != null && value !== '') {
      params.set(key, String(value))
    }
  }
  params.set('token', config.adressevaelgerToken as string)

  const upstreamUrl = `${config.adressevaelgerApiUrl}/${segments.join('/')}?${params.toString()}`

  try {
    const data = await $fetch(upstreamUrl, { timeout: 6000 })
    // Suggestions change rarely; let the browser cache them briefly to ease typing bursts.
    setHeader(event, 'Cache-Control', 'public, max-age=60')
    return data
  }
  catch (err) {
    console.error('Adressevælger proxy error', err)
    throw createError({ statusCode: 502, statusMessage: 'Address service unavailable' })
  }
})
