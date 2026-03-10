import { CatchBoundary, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { SearchResults } from './-components/search-results'
import {
  YEAR_MAX,
  YEAR_MIN,
  eyepiecePageSearchParamsSchema,
} from '@/lib/eyepiece-api-client/types'
import { hasSearchFields } from '@/lib/eyepiece-api-client/util'
import { SearchBar } from '@/features/search/components/search-bar/search-bar'
import { getTitleText } from '@/lib/utils'
import { PrettyException } from '@/components/ui/error'
import { paramsToUiResetKey } from '@/features/listing/infinite-loader/components/infinite-loader.utils'
import { prefetchInfiniteSearch } from '@/features/search/search.queries'
import { PageHeading } from '@/routes/-components/page-heading'
import { AssetGridSkeleton } from '@/routes/-components/asset-grid-skeleton'

const NO_SEARCH_TITLE = 'Search NASA Images and Videos'

function searchTitle(query?: string) {
  return query ? `Search for "${query}"` : NO_SEARCH_TITLE
}

function SearchHeading({ query }: { query?: string }) {
  return (
    <PageHeading style={{ alignSelf: 'center' }}>
      {searchTitle(query)}
    </PageHeading>
  )
}

export const Route = createFileRoute('/(pages)/(search)/')({
  component: SearchPage,
  validateSearch: eyepiecePageSearchParamsSchema,
  loaderDeps: ({ search }) => {
    if (hasSearchFields(search)) {
      return { search }
    } else {
      return {}
    }
  },
  loader: async ({ context, deps: { search } }) => {
    if (search) {
      await prefetchInfiniteSearch({
        eyepieceClient: context.eyepieceClient,
        queryClient: context.queryClient,
        searchParams: search,
      })
    }
  },
  head: ({ match }) => ({
    meta: [
      {
        title: getTitleText(searchTitle(match.search.q)),
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <>
      <SearchHeading />
      <p>Error loading search.</p>
      <PrettyException error={error} headingLevel={1} />
    </>
  ),
})

function SearchPage() {
  const searchParams = Route.useSearch()
  const hasSearch = hasSearchFields(searchParams)
  return (
    <>
      <SearchHeading query={searchParams.q} />
      <SearchBar
        fontSize="1.5rem"
        css={{ maxWidth: '640px', margin: '3rem auto' }}
        defaultMediaType={searchParams.mediaType}
        defaultSearchText={searchParams.q}
        defaultYears={
          searchParams.yearStart || searchParams.yearEnd
            ? [
                searchParams.yearStart || YEAR_MIN,
                searchParams.yearEnd || YEAR_MAX,
              ]
            : undefined
        }
      />
      {hasSearch && (
        <CatchBoundary
          getResetKey={() => paramsToUiResetKey(searchParams)}
          errorComponent={({ error }) => (
            <PrettyException error={error} headingLevel={1} />
          )}
        >
          <Suspense fallback={<AssetGridSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </CatchBoundary>
      )}
    </>
  )
}
