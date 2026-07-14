import { defaultStringifySearch } from '@tanstack/react-router'

// defaultStringifySearch serializes in object insertion order; sorting keys
// first makes equal searches serialize identically (stable hrefs and CDN
// cache keys). Wired in as the router's stringifySearch.
export function stringifySearchParams(search: Record<string, unknown>) {
  return defaultStringifySearch(
    Object.fromEntries(
      Object.entries(search).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    ),
  )
}
