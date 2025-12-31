import { createFileRoute } from '@tanstack/react-router'
import {
  eyepiecePageSearchParamsSchema,
  YEAR_MAX,
  YEAR_MIN,
} from '@/lib/api/eyepiece/types'
import { hasSearchFields } from '@/lib/api/eyepiece/util'
import { SearchBar } from '@/features/search/components/search-bar'
import { SearchResults } from './-components/search-results'
import { searchImagesOptions } from '@/features/search/api/search-queries'

export const Route = createFileRoute('/(pages)/(search)/')({
  component: SearchView,
  validateSearch: eyepiecePageSearchParamsSchema,
  beforeLoad: () => ({
    title: 'Search NASA Images and Videos',
  }),
  loaderDeps: ({ search }) => {
    if (hasSearchFields(search)) {
      return { search }
    } else {
      return {}
    }
  },
  loader: ({ context, deps: { search } }) => {
    if (search) {
      return context.queryClient.ensureInfiniteQueryData(
        searchImagesOptions(search),
      )
    }
  },
})

export function SearchView() {
  const searchParams = Route.useSearch()
  const hasSearch = hasSearchFields(searchParams)
  return (
    <div
      css={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1 css={{ color: 'var(--text-accent)' }}>
        {hasSearch
          ? `Search for "${searchParams.q}"`
          : 'Search NASA images and videos'}
      </h1>
      <SearchBar
        fontSize="1.5rem"
        css={{ maxWidth: '640px', margin: '3rem auto' }}
        defaultMediaType={searchParams?.mediaType}
        defaultSearchText={searchParams?.q}
        defaultYears={
          searchParams?.yearStart || searchParams?.yearEnd
            ? [
                searchParams.yearStart || YEAR_MIN,
                searchParams.yearEnd || YEAR_MAX,
              ]
            : undefined
        }
      />
      {hasSearch && <SearchResults searchParams={searchParams} />}
    </div>
  )
}
