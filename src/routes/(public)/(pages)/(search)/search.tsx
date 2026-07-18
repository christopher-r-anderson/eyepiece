import { Suspense } from 'react'
import {
  CatchBoundary,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { css } from 'styled-system/css'
import { SearchResults } from './-components/search-results'
import { SearchPrompt } from './-components/search-prompt'
import { AllProvidersResults } from './-components/all-providers-results'
import type {
  SearchPageState,
  SearchScope,
} from '@/features/search/search-page-params'
import { getTitleText } from '@/lib/utils'
import { CapturedPrettyError, RouteError } from '@/app/layout/route-error'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { SearchBar } from '@/features/search/components/search-bar'
import { SearchScopeTabs } from '@/features/search/components/search-scope-tabs'
import {
  searchPageParamsSchema,
  toSearchPageState,
} from '@/features/search/search-page-params'
import { useCanonicalSearchReplace } from '@/features/search/hooks/use-canonical-search-replace'
import { PROVIDERS, PROVIDER_DISPLAY } from '@/domain/provider/provider.schema'
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
          headingLevel={1}
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
  const { q, scope } = state
  useCanonicalSearchReplace()
  const hasQuery = q.trim().length > 0
  const formResetKey = hashKey(['search-form', q, scope])

  return (
    <>
      <PageHeading>{searchTitle(state)}</PageHeading>
      <div
        className={css({
          width: '100%',
          maxWidth: 'pageColMax',
          marginInline: 'auto',
          paddingInline: '4',
        })}
      >
        <SearchBar key={formResetKey} initialQuery={q} scope={scope} />
      </div>
      <SearchScopeTabs q={q} scope={scope}>
        {!hasQuery ? (
          <SearchPrompt />
        ) : scope.scope !== 'provider' ? (
          <AllProvidersResults query={q} />
        ) : (
          <ScopedSearchResults q={q} scope={scope} />
        )}
      </SearchScopeTabs>
    </>
  )
}
