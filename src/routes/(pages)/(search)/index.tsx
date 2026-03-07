import { createFileRoute } from '@tanstack/react-router'
import { SearchResults } from './-components/search-results'
import {
  YEAR_MAX,
  YEAR_MIN,
  eyepiecePageSearchParamsSchema,
} from '@/lib/eyepiece-api-client/types'
import { hasSearchFields } from '@/lib/eyepiece-api-client/util'
import { SearchBar } from '@/features/search/components/search-bar/search-bar'
import { searchImagesOptions } from '@/features/search/search.queries'
import { getTitleText } from '@/lib/utils'
import { makeSearchRepo } from '@/features/search/search.repo'

const NO_SEARCH_TITLE = 'Search NASA Images and Videos'

export const Route = createFileRoute('/(pages)/(search)/')({
  component: SearchView,
  validateSearch: eyepiecePageSearchParamsSchema,
  loaderDeps: ({ search }) => {
    if (hasSearchFields(search)) {
      return { search }
    } else {
      return {}
    }
  },
  loader: ({ context, deps: { search } }) => {
    if (search) {
      const searchRepo = makeSearchRepo(context.eyepieceClient)
      return context.queryClient.ensureInfiniteQueryData(
        searchImagesOptions({ repo: searchRepo, params: search }),
      )
    }
  },
  head: ({ match }) => ({
    meta: [
      {
        title: getTitleText(
          match.search.q ? `Search for "${match.search.q}"` : NO_SEARCH_TITLE,
        ),
      },
    ],
  }),
})

export function SearchView() {
  const searchParams = Route.useSearch()
  const hasSearch = hasSearchFields(searchParams)
  return (
    <main
      css={{
        width: '100%',
        maxWidth: '1200px',
        flexGrow: 1,
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>
        {hasSearch ? `Search for "${searchParams.q}"` : NO_SEARCH_TITLE}
      </h1>
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
      {hasSearch && <SearchResults searchParams={searchParams} />}
    </main>
  )
}
