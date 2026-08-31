import { createIsomorphicFn, createServerOnlyFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const PARSE_BASE = 'http://parse.local'

export const STRIP_PARAMS = ['next', 'formError', 'status'] as const

export const getTitleText = (title: string | undefined) => {
  return title
    ? `${title} | Eyepiece`
    : 'Eyepiece: astronomy image search and collections'
}

export function urlToNextParam(url: string) {
  const u = new URL(url, PARSE_BASE)
  for (const key of STRIP_PARAMS) u.searchParams.delete(key)
  return `${u.pathname}${u.search}${u.hash}`
}

export const getOrigin = createIsomorphicFn()
  .server(() => new URL(getRequest().url).origin)
  .client(() => window.location.origin)

// the verbatim query substring of an href; URL#search collapses a bare
// trailing '?' to '', which is still its own CDN cache key. Only a '?'
// before the fragment starts a query - '/search#panel?tab=1' has none
export function rawSearchOfHref(href: string) {
  const hashStart = href.indexOf('#')
  const beforeHash = hashStart === -1 ? href : href.slice(0, hashStart)
  const queryStart = beforeHash.indexOf('?')
  return queryStart === -1 ? '' : beforeHash.slice(queryStart)
}

// the request URL's verbatim query string; location.searchStr is the
// re-serialized parse result and cannot stand in for it. Server-only: a
// client raw read must come from router.history.location, never the
// lagging window.location
export const getRawSearch = createServerOnlyFn(() =>
  rawSearchOfHref(getRequest().url),
)

// undo restores a row's original timestamp for ordering; never a
// client-chosen point in the future
export function clampIsoToNow(iso: string): string {
  return new Date(iso) > new Date() ? new Date().toISOString() : iso
}
