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
// cache keys). Empty-string values serialize as absent: an empty param
// carries no value, and native GET submits serialize every named field,
// including untouched ones. Wired in as the router's stringifySearch.
export function stringifySearchParams(search: Record<string, unknown>) {
  return defaultStringifySearch(
    Object.fromEntries(
      Object.entries(search)
        .filter(([, value]) => value !== '')
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  )
}
