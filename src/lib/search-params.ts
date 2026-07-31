import {
  defaultParseSearch,
  defaultStringifySearch,
} from '@tanstack/react-router'

// browsers form-encode spaces as '+' (application/x-www-form-urlencoded)
// but defaultParseSearch only percent-decodes; restoring those spaces first
// keeps native form submissions correct. A literal plus arrives as %2B and
// is untouched. Wired in as the router's parseSearch.
export function parseSearchParams(searchStr: string) {
  return defaultParseSearch(searchStr.replace(/\+/g, ' '))
}

// defaultStringifySearch serializes in object insertion order; sorting keys
// first makes equal searches serialize identically (stable hrefs and CDN
// cache keys). Empty-string values pass through: API and integration
// clients build request URLs with this, and a required-but-empty param
// (`q=`) must survive.
export function stringifySearchParams(search: Record<string, unknown>) {
  return defaultStringifySearch(
    Object.fromEntries(
      Object.entries(search).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  )
}

// Internal API request params: plain URLSearchParams encoding, symmetric
// with the server middleware's URLSearchParams read. The router serializer
// JSON-quotes type-ambiguous strings (a numeric cursor becomes `"1"`),
// which the API would reject. Keys sorted for stable CDN cache keys;
// undefined dropped; empty strings kept (`q=` must survive).
export function stringifyApiSearchParams(
  search: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  )) {
    if (value !== undefined) {
      params.set(key, String(value))
    }
  }
  const searchStr = params.toString()
  return searchStr ? `?${searchStr}` : ''
}

// The router's stringifySearch: additionally serializes empty-string values
// as absent. An empty param carries no value at the app's URL boundary, and
// native GET submits serialize every named field, including untouched ones.
export function stringifyCanonicalSearchParams(
  search: Record<string, unknown>,
) {
  return stringifySearchParams(
    Object.fromEntries(
      Object.entries(search).filter(([, value]) => value !== ''),
    ),
  )
}
