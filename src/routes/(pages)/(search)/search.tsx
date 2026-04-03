import { Suspense } from 'react'
import { CatchBoundary, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { hashKey } from '@tanstack/react-query'
import { SearchResults } from './-components/search-results'
import { getTitleText } from '@/lib/utils'
import { PrettyException } from '@/components/ui/error'
import { RouteError } from '@/app/layout/route-error'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'
import { SelectedProviderSearchBar } from '@/features/search/components/search-bar'
import {
  searchFiltersSchema,
  searchQuerySchema,
} from '@/domain/search/search.schema'

function searchTitle(query: string) {
  return `Search for "${query}"`
}

const searchQueryParamSchema = z.object({
  q: searchQuerySchema,
})

export const Route = createFileRoute('/(pages)/(search)/search')({
  component: SearchPage,
  validateSearch: searchQueryParamSchema.and(searchFiltersSchema),
  loaderDeps: ({ search }) => {
    return search
  },
  loader: async ({ context, deps }) => {
    const filters = searchFiltersSchema.parse(deps)
    await prefetchInfiniteSearch({
      query: searchQueryParamSchema.parse(deps).q,
      filters,
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
  errorComponent: ({ error }) => (
    <RouteError
      error={error}
      heading={<PageHeading>Search Error</PageHeading>}
      message="Error loading search."
    />
  ),
})

function SearchPage() {
  const search = Route.useSearch()
  const filters = searchFiltersSchema.parse(search)
  const { q } = searchQueryParamSchema.parse(search)
  const formResetKey = hashKey(['search-form', q, filters])

  return (
    <>
      <PageHeading>{searchTitle(q)}</PageHeading>
      <div css={{ maxWidth: '640px', margin: '3rem auto' }}>
        <SelectedProviderSearchBar
          key={formResetKey}
          initialQuery={q}
          initialFilters={filters}
        />
      </div>
      <CatchBoundary
        getResetKey={() => hashKey(['search-page-results', q, filters])}
        errorComponent={({ error }) => (
          <PrettyException error={error} headingLevel={1} />
        )}
      >
        <Suspense fallback={<AssetGridSkeleton />}>
          <SearchResults query={q} filters={filters} />
        </Suspense>
      </CatchBoundary>
    </>
  )
}
