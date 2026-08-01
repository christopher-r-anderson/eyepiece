import { useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import {
  searchPageParamsSchema,
  toCanonicalUrlParams,
} from '../search-page-params'
import { stringifyCanonicalSearchParams } from '@/lib/search-params'
import { rawSearchOfHref } from '@/lib/utils'

// The one canonical spelling for a /search location's params; both
// canonicalization tiers (the SSR redirect in the search route and the
// client replace below) compare the RAW url against this.
export function canonicalSearchStr(search: Record<string, unknown>): string {
  return stringifyCanonicalSearchParams(
    toCanonicalUrlParams(searchPageParamsSchema.parse(search)),
  )
}

// The client tier of search canonicalization: replace-navigates
// non-canonical /search URLs (junk params, invalid values, param
// order/encoding variants) reached without a document load. The SSR tier
// is the search route's beforeLoad 307 - an uncacheable redirect, so the
// one-spelling-per-CDN-key invariant survives it.
//
// Gotchas this depends on:
// - compare raw strings, not parsed objects: variants that parse equal are
//   still distinct cache keys, and the router drops order-only object
//   replaces via structural sharing (hence history.replace)
// - the raw side is router.history.location.href: location.searchStr is
//   re-serialized and always reads as canonical, and window.location lags
//   the history's microtask-deferred DOM writes (reading it here
//   replace-looped warm-cache navigations to React's update-depth limit)
// - derive the target from the one location snapshot; mixing in
//   Route.useSearch() tears during transitions and cancels in-flight
//   navigations
// - loop-free because the canonical string is a fixed point of
//   parse -> serialize (schema idempotence is unit-tested) and a replace
//   reaches history.location synchronously
export function useCanonicalSearchReplace() {
  const location = useRouterState({ select: (state) => state.location })
  const router = useRouter()

  useEffect(() => {
    // a masked location (asset overlay) displays a different URL entirely;
    // replacing it would tear the mask down mid-overlay
    if (location.maskedLocation) {
      return
    }
    const targetSearchStr = canonicalSearchStr(location.search)
    if (rawSearchOfHref(router.history.location.href) === targetSearchStr) {
      return
    }
    const hashStr = location.hash ? `#${location.hash}` : ''
    // carry the entry's state: a bare replace rebuilds it as {key, index},
    // stripping dialogPushed/viewingAsset from an open dialog's entry
    router.history.replace(
      `${location.pathname}${targetSearchStr}${hashStr}`,
      location.state,
    )
  }, [location, router])
}
