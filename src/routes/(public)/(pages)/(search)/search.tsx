import { Suspense } from 'react'
import {
  CatchBoundary,
  createFileRoute,
  useRouterState,
} from '@tanstack/react-router'
import { hashKey } from '@tanstack/react-query'
import { SearchResults } from './-components/search-results'
import type { SearchFilters } from '@/domain/search/search.schema'
import { getTitleText } from '@/lib/utils'
import { CapturedPrettyError, RouteError } from '@/app/layout/route-error'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import {
  AnyProviderSearchBar,
  SelectedProviderSearchBar,
} from '@/features/search/components/search-bar'
import { searchFiltersSchema } from '@/domain/search/search.schema'

function searchTitle(query: string) {
  return query ? `Search for "${query}"` : 'Search'
}

// Missing or invalid provider filters degrade to the provider-picker state
// instead of failing the route match: shared, bookmarked, or hand-edited URLs
// must not error, and the page stays publicly cacheable.
export type SearchPageSearch = { q: string } & (
  | SearchFilters
  | { providerId?: undefined; filters?: undefined }
)

function toSearchQuery(value: unknown): string {
  if (typeof value === 'string') return value
  // TanStack Router JSON-parses search values, so ?q=123 arrives as a number.
  if (typeof value === 'number') return String(value)
  return ''
}

export function validateSearchPageParams(
  search: Record<string, unknown>,
): SearchPageSearch {
  const q = toSearchQuery(search.q)
  // A valid provider without explicit filters is a reasonable URL; default them.
  const candidate =
    'providerId' in search && !('filters' in search)
      ? { ...search, filters: {} }
      : search
  const filters = searchFiltersSchema.safeParse(candidate)

  return filters.success ? { q, ...filters.data } : { q }
}

export const Route = createFileRoute('/(public)/(pages)/(search)/search')({
  component: SearchPage,
  validateSearch: validateSearchPageParams,
  loaderDeps: ({ search }) => {
    return search
  },
  loader: async ({ context, deps }) => {
    const filters = searchFiltersSchema.safeParse(deps)
    if (!filters.success) {
      // No provider selected: the page renders the picker, nothing to prefetch.
      return
    }
    await prefetchInfiniteSearch({
      query: deps.q,
      filters: filters.data,
      eyepieceClient: context.eyepieceClient,
      queryClient: context.queryClient,
    })
  },
  head: ({ match }) => ({
    meta: [
      {
        title: getTitleText(searchTitle(match.search.q)),
      },
    ],
  }),
  errorComponent: SearchRouteError,
})

export function getSearchErrorProviderId(search: unknown) {
  const result = searchFiltersSchema.safeParse(search)

  return result.success ? result.data.providerId : undefined
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

function ProviderPickerSearchPage({ query }: { query: string }) {
  return (
    <>
      <PageHeading>{searchTitle(query)}</PageHeading>
      <div
        css={{
          width: '100%',
          maxWidth: '40rem',
          margin: 'var(--space-7) auto',
          paddingInline: 'var(--space-4)',
        }}
      >
        <AnyProviderSearchBar initialQuery={query} />
      </div>
    </>
  )
}

function SearchPage() {
  const search = Route.useSearch()
  const parsedFilters = searchFiltersSchema.safeParse(search)
  const q = search.q

  if (!parsedFilters.success) {
    return <ProviderPickerSearchPage query={q} />
  }

  const filters = parsedFilters.data
  const formResetKey = hashKey(['search-form', q, filters])

  return (
    <>
      <PageHeading>{searchTitle(q)}</PageHeading>
      <div
        css={{
          width: '100%',
          maxWidth: '40rem',
          margin: 'var(--space-7) auto',
          paddingInline: 'var(--space-4)',
        }}
      >
        <SelectedProviderSearchBar
          key={formResetKey}
          initialQuery={q}
          initialFilters={filters}
        />
      </div>
      <CatchBoundary
        getResetKey={() => hashKey(['search-page-results', q, filters])}
        errorComponent={({ error }) => (
          <CapturedPrettyError
            error={error}
            headingLevel={1}
            captureContext={{
              boundaryKind: 'catch',
              feature: 'search',
              providerId: filters.providerId,
              operation: 'load_search_results',
            }}
          />
        )}
      >
        <Suspense fallback={<AssetGridSkeleton />}>
          <SearchResults query={q} filters={filters} />
        </Suspense>
      </CatchBoundary>
    </>
  )
}
