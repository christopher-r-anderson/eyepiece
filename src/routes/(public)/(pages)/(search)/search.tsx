import { Suspense, useEffect, useId, useRef, useState } from 'react'
import {
  CatchBoundary,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { SearchResults } from './-components/search-results'
import { SearchPrompt } from './-components/search-prompt'
import { AllProvidersResults } from './-components/all-providers-results'
import { QueryHeadline } from './-components/query-headline'
import type {
  SearchPageState,
  SearchScope,
} from '@/features/search/search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { getTitleText } from '@/lib/utils'
import { CapturedPrettyError, RouteError } from '@/app/layout/route-error'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { SearchBar } from '@/features/search/components/search-bar'
import { SearchConditions } from '@/features/search/components/search-conditions'
import { SearchScopeTabs } from '@/features/search/components/search-scope-tabs'
import {
  searchPageParamsSchema,
  toSearchPageParams,
  toSearchPageState,
} from '@/features/search/search-page-params'
import { useCanonicalSearchReplace } from '@/features/search/hooks/use-canonical-search-replace'
import {
  NASA_IVL_PROVIDER_ID,
  PROVIDERS,
  PROVIDER_DISPLAY,
} from '@/domain/provider/provider.schema'
import { defaultSearchFilters } from '@/domain/search/search.schema'

function searchTitle({ q, scope }: SearchPageState) {
  if (q.trim().length === 0) {
    return 'Search'
  }
  const title = `Search for "${q}"`
  return scope.scope === 'provider'
    ? `${title} – ${PROVIDER_DISPLAY[scope.filters.providerId].shortLabel}`
    : title
}

export const Route = createFileRoute('/(public)/(pages)/(search)/search')({
  component: SearchPage,
  validateSearch: searchPageParamsSchema,
  // re-parse drops parent-route params (auth modal) from deps so modal
  // toggles don't re-fire the loader
  loaderDeps: ({ search }) => searchPageParamsSchema.parse(search),
  loader: async ({ context, deps }) => {
    const { q, scope } = toSearchPageState(deps)
    if (q.trim().length === 0) {
      return
    }
    if (scope.scope !== 'provider') {
      // deliberately not awaited: queries stream as they settle, so TTFB
      // and healthy sections never wait on the slowest provider; a failed
      // prefetch refetches client-side into its own section boundary
      for (const providerId of PROVIDERS) {
        void prefetchInfiniteSearch({
          query: q,
          filters: defaultSearchFilters(providerId),
          eyepieceClient: context.eyepieceClient,
          queryClient: context.queryClient,
        })
      }
      return
    }
    await prefetchInfiniteSearch({
      query: q,
      filters: scope.filters,
      eyepieceClient: context.eyepieceClient,
      queryClient: context.queryClient,
    })
  },
  head: ({ match }) => ({
    meta: [
      {
        title: getTitleText(searchTitle(toSearchPageState(match.search))),
      },
    ],
  }),
  errorComponent: SearchRouteError,
})

export function getSearchErrorProviderId(search: unknown) {
  const params = searchPageParamsSchema.safeParse(search)
  if (!params.success) {
    return undefined
  }
  const { scope } = toSearchPageState(params.data)
  return scope.scope === 'provider' ? scope.filters.providerId : undefined
}

function SearchRouteError({ error }: { error: unknown }) {
  const rawSearch = useRouterState({
    select: (state) => state.location.search,
  })
  const providerId = getSearchErrorProviderId(rawSearch)

  return (
    <RouteError
      error={error}
      heading={<PageHeading>Search Error</PageHeading>}
      message="Error loading search."
      captureContext={{
        boundaryKind: 'route',
        feature: 'search',
        providerId,
        operation: 'load_search_page',
      }}
    />
  )
}

function ScopedSearchResults({
  q,
  scope,
}: {
  q: string
  scope: Extract<SearchScope, { scope: 'provider' }>
}) {
  return (
    <CatchBoundary
      getResetKey={() => hashKey(['search-page-results', q, scope])}
      errorComponent={({ error }) => (
        <CapturedPrettyError
          error={error}
          headingLevel={2}
          captureContext={{
            boundaryKind: 'catch',
            feature: 'search',
            providerId: scope.filters.providerId,
            operation: 'load_search_results',
          }}
        />
      )}
    >
      <Suspense fallback={<AssetGridSkeleton />}>
        <SearchResults query={q} filters={scope.filters} />
      </Suspense>
    </CatchBoundary>
  )
}

function SearchPage() {
  const search = Route.useSearch()
  const params = searchPageParamsSchema.parse(search)
  const state = toSearchPageState(params)
  useCanonicalSearchReplace()
  const { q, scope } = state
  const hasQuery = q.trim().length > 0
  const formId = useId()
  const navigate = useNavigate()
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const [nasaFilters, setNasaFilters] = useState<NasaIvlSearchFilters>(
    isNasaScope ? scope.filters.filters : {},
  )

  // a navigation that changes the URL filters (scope switch, back button,
  // canonical drops) resets the year inputs without remounting them, so
  // focus survives blur commits. Runs as an effect so interrupted renders
  // (the search-state tearing gotcha) never act, and a change matching our
  // own in-flight commit skips the reset - the user may already be typing
  // in the other field
  const lastCommittedScopeKeyRef = useRef<string | null>(null)
  const scopeFiltersKey = hashKey(['scope-filters', scope])
  const lastSyncedScopeKeyRef = useRef(scopeFiltersKey)
  useEffect(() => {
    if (lastSyncedScopeKeyRef.current === scopeFiltersKey) {
      return
    }
    lastSyncedScopeKeyRef.current = scopeFiltersKey
    if (lastCommittedScopeKeyRef.current === scopeFiltersKey) {
      lastCommittedScopeKeyRef.current = null
      return
    }
    lastCommittedScopeKeyRef.current = null
    setNasaFilters(isNasaScope ? scope.filters.filters : {})
  }, [scopeFiltersKey, isNasaScope, scope])

  // blur commits apply the URL's query, not in-progress typing in the
  // search box; Enter still submits the whole form
  function commitNasaFilters() {
    if (!isNasaScope) {
      return
    }
    if (hashKey([nasaFilters]) === hashKey([scope.filters.filters])) {
      return
    }
    const committedScope = {
      scope: 'provider' as const,
      filters: { providerId: NASA_IVL_PROVIDER_ID, filters: nasaFilters },
    }
    lastCommittedScopeKeyRef.current = hashKey([
      'scope-filters',
      committedScope,
    ])
    void navigate({
      to: '/search',
      search: toSearchPageParams(q, committedScope),
    })
  }

  return (
    <div className={css({ width: '100%' })}>
      <SearchBar
        key={hashKey(['search-form', q, scope])}
        id={formId}
        initialQuery={q}
        scope={scope}
        nasaFilters={nasaFilters}
      />
      {hasQuery && (
        // not keyed by the search state: the entrance plays on page
        // arrival, not on every scope or filter navigation
        <div className={css({ marginTop: '6' })}>
          <QueryHeadline query={q} />
        </div>
      )}
      <div className={css({ marginTop: '5' })}>
        <SearchScopeTabs q={q} scope={scope} />
      </div>
      {(hasQuery || isNasaScope) && (
        <div className={css({ marginTop: '2' })}>
          <SearchConditions
            q={q}
            scope={scope}
            formId={formId}
            nasaFilters={nasaFilters}
            onNasaFiltersChange={setNasaFilters}
            onNasaFiltersCommit={commitNasaFilters}
          />
        </div>
      )}
      <div className={css({ marginTop: hasQuery ? '4' : '5' })}>
        {!hasQuery ? (
          <SearchPrompt />
        ) : scope.scope !== 'provider' ? (
          <AllProvidersResults query={q} />
        ) : (
          <ScopedSearchResults q={q} scope={scope} />
        )}
      </div>
    </div>
  )
}
