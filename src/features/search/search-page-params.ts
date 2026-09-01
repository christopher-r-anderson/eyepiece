import { z } from 'zod'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchFilters } from '@/domain/search/search.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
  providerIdSchema,
} from '@/domain/provider/provider.schema'
import { nasaIvlSearchFiltersLenientSchema } from '@/domain/search/providers/nasa-ivl-filters'

// Lenient at the /search URL boundary (salvage per key, never throw), strict
// after parse. See docs/Search.md.

// Type alias, not interface: needs the implicit index signature to stay
// assignable to the router's validateSearch input type.
export type SearchPageParams = {
  q: string
  providerId?: ProviderId
  yearStart?: number
  yearEnd?: number
}

export type SearchScope =
  { scope: 'all' } | { scope: 'provider'; filters: SearchFilters }

export interface SearchPageState {
  q: string
  scope: SearchScope
}

// TanStack Router JSON-parses search values, so ?q=123 arrives as a number.
const lenientSearchQuerySchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .catch('')

function compactDefined<T extends Record<string, unknown>>(params: T): T {
  const compacted = {} as Record<string, unknown>
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      compacted[key] = value
    }
  }
  return compacted as T
}

export const searchPageParamsSchema = z
  .looseObject({
    q: lenientSearchQuerySchema,
    providerId: providerIdSchema.optional().catch(undefined),
  })
  .transform((raw): SearchPageParams => {
    if (raw.providerId === NASA_IVL_PROVIDER_ID) {
      return compactDefined({
        q: raw.q,
        providerId: raw.providerId,
        ...nasaIvlSearchFiltersLenientSchema.parse(raw),
      })
    }
    if (raw.providerId === SI_OA_PROVIDER_ID) {
      return { q: raw.q, providerId: raw.providerId }
    }
    return { q: raw.q }
  })

export function toSearchPageState(params: SearchPageParams): SearchPageState {
  if (params.providerId === NASA_IVL_PROVIDER_ID) {
    return {
      q: params.q,
      scope: {
        scope: 'provider',
        filters: {
          providerId: params.providerId,
          filters: compactDefined({
            yearStart: params.yearStart,
            yearEnd: params.yearEnd,
          }),
        },
      },
    }
  }
  if (params.providerId === SI_OA_PROVIDER_ID) {
    return {
      q: params.q,
      scope: {
        scope: 'provider',
        filters: { providerId: params.providerId, filters: {} },
      },
    }
  }
  return { q: params.q, scope: { scope: 'all' } }
}

export function toSearchPageParams(
  q: string,
  scope: SearchScope,
): SearchPageParams {
  const query = q.trim()
  if (scope.scope === 'all') {
    return { q: query }
  }
  if (scope.filters.providerId === NASA_IVL_PROVIDER_ID) {
    return compactDefined({
      q: query,
      providerId: scope.filters.providerId,
      ...scope.filters.filters,
    })
  }
  return { q: query, providerId: scope.filters.providerId }
}

// A provider scope with no filters - the payload for "see all" and
// cross-provider links, built through the shared builder per Search.md.
export function toProviderSearchParams(
  q: string,
  providerId: ProviderId,
): SearchPageParams {
  return toSearchPageParams(q, {
    scope: 'provider',
    filters: { providerId, filters: {} },
  })
}

// Omits an empty q so /search?q= and /search share one CDN cache key.
export function toCanonicalUrlParams(
  params: SearchPageParams,
): Partial<SearchPageParams> {
  const { q, ...rest } = params
  return compactDefined(q === '' ? rest : params)
}
