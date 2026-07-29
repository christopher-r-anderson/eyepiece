import { Suspense, useEffect, useRef, useState } from 'react'
import {
  CatchBoundary,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { visuallyHidden } from 'styled-system/patterns'
import { SearchResults } from './-components/search-results'
import { SearchPrompt } from './-components/search-prompt'
import { AllProvidersResults } from './-components/all-providers-results'
import { QueryHeadline } from './-components/query-headline'
import type {
  SearchPageState,
  SearchScope,
} from '@/features/search/search-page-params'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import { getRawSearch, getTitleText } from '@/lib/utils'
import { CapturedPrettyError, RouteError } from '@/app/layout/route-error'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/components/page-heading'
import { AssetGridSkeleton } from '@/features/assets/components/asset-grid-skeleton'
import { SEARCH_FORM_ID } from '@/features/search/components/search-bar'
import { SearchConditions } from '@/features/search/components/search-conditions'
import { SearchScopeTabs } from '@/features/search/components/search-scope-tabs'
import {
  searchPageParamsSchema,
  toSearchPageState,
} from '@/features/search/search-page-params'
import {
  canonicalSearchStr,
  useCanonicalSearchReplace,
} from '@/features/search/hooks/use-canonical-search-replace'
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
  // the SSR tier of search canonicalization: one cached document per
  // spelling, so non-canonical spellings 307 to the canonical one before
  // any route work (router 1.170 dropped its built-in redirect). The
  // client tier stays useCanonicalSearchReplace - a client-side beforeLoad
  // redirect would cancel in-flight navigations.
  beforeLoad: ({ location }) => {
    if (typeof document !== 'undefined') {
      return
    }
    const targetSearchStr = canonicalSearchStr(location.search)
    if (getRawSearch() !== targetSearchStr) {
      throw redirect({
        href: `${location.pathname}${targetSearchStr}`,
        statusCode: 307,
      })
    }
  },
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
  const isNasaScope =
    scope.scope === 'provider' &&
    scope.filters.providerId === NASA_IVL_PROVIDER_ID
  const [nasaFilters, setNasaFilters] = useState<NasaIvlSearchFilters>(
    isNasaScope ? scope.filters.filters : {},
  )

  // a navigation that changes the URL filters (scope switch, back button,
  // canonical drops) re-syncs the year inputs without remounting them, so
  // focus survives a blur that commits. a navigation caused by our own
  // commit skips the reset: the effect can run after the user has already
  // typed into the next field, and that draft must survive
  const scopeFiltersKey = hashKey(['scope-filters', scope])
  const lastSyncedScopeKeyRef = useRef(scopeFiltersKey)
  const lastCommittedFiltersKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (lastSyncedScopeKeyRef.current === scopeFiltersKey) {
      return
    }
    lastSyncedScopeKeyRef.current = scopeFiltersKey
    const urlFilters = isNasaScope ? scope.filters.filters : {}
    const isOwnCommit =
      lastCommittedFiltersKeyRef.current === hashKey([urlFilters])
    lastCommittedFiltersKeyRef.current = null
    if (!isOwnCommit) {
      setNasaFilters(urlFilters)
    }
  }, [scopeFiltersKey, isNasaScope, scope])

  // a committed year edit submits the whole form, exactly as Enter or the
  // search button does, so the query and filters always travel together and
  // land on one URL. checkValidity keeps a blur silent on an invalid range -
  // Enter and the button surface native validation instead
  function commitNasaFilters() {
    if (!isNasaScope) {
      return
    }
    if (hashKey([nasaFilters]) === hashKey([scope.filters.filters])) {
      return
    }
    const form = document.getElementById(SEARCH_FORM_ID)
    if (form instanceof HTMLFormElement && form.checkValidity()) {
      lastCommittedFiltersKeyRef.current = hashKey([nasaFilters])
      form.requestSubmit()
    }
  }

  return (
    <div className={css({ width: '100%' })}>
      {hasQuery ? (
        // not keyed by the search state: the entrance plays on page
        // arrival, not on every scope or filter navigation
        <div className={css({ marginTop: '2' })}>
          <QueryHeadline query={q} />
        </div>
      ) : (
        // the empty state is headingless by design, but the page still
        // needs an h1 for heading navigation
        <h1 className={visuallyHidden()}>Search</h1>
      )}
      <div className={css({ marginTop: '5' })}>
        <SearchScopeTabs q={q} scope={scope} />
      </div>
      {(hasQuery || isNasaScope) && (
        <div className={css({ marginTop: '2' })}>
          <SearchConditions
            q={q}
            scope={scope}
            formId={SEARCH_FORM_ID}
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
