import { useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import {
  searchPageParamsSchema,
  toCanonicalUrlParams,
} from '../search-page-params'
import { pickAuthSearchParams } from '@/features/auth/auth.utils'
import { stringifyCanonicalSearchParams } from '@/lib/search-params'

// Replace-navigates non-canonical /search URLs (junk params, invalid values,
// param order/encoding variants) to a single spelling per document for CDN
// cache keys. Client-side only: any spelling must SSR the content directly,
// never a cacheable redirect.
//
// Gotchas this depends on:
// - compare raw strings, not parsed objects: variants that parse equal are
//   still distinct cache keys, and the router drops order-only object
//   replaces via structural sharing (hence history.replace)
// - derive everything from the one location snapshot; mixing in
//   Route.useSearch() tears during transitions and cancels in-flight
//   navigations
// - loop-free because the canonical string is a fixed point of
//   parse -> serialize (schema idempotence is unit-tested)
export function useCanonicalSearchReplace() {
  const location = useRouterState({ select: (state) => state.location })
  const router = useRouter()

  useEffect(() => {
    const target = {
      ...toCanonicalUrlParams(searchPageParamsSchema.parse(location.search)),
      ...pickAuthSearchParams(location.search),
    }
    const targetSearchStr = stringifyCanonicalSearchParams(target)
    if (location.searchStr === targetSearchStr) {
      return
    }
    const hashStr = location.hash ? `#${location.hash}` : ''
    router.history.replace(`${location.pathname}${targetSearchStr}${hashStr}`)
  }, [location, router])
}
