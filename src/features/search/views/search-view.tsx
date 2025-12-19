import { hasSearchFields } from '@/lib/api/eyepiece/util'
import { SearchBar } from '../components/search-bar'
import {
  EyepieceSearchParams,
  YEAR_MAX,
  YEAR_MIN,
} from '@/lib/api/eyepiece/types'
import { SearchResults } from '../components/search-results'
import { ComponentPropsWithoutRef } from 'react'

interface SearchViewProps extends ComponentPropsWithoutRef<'div'> {
  searchParams: EyepieceSearchParams
}

export function SearchView({ searchParams, ...props }: SearchViewProps) {
  const hasSearch = hasSearchFields(searchParams)
  return (
    <div
      {...props}
      css={{
        // display: 'flex',
        // alignItems: 'center',
        // flexDirection: 'column',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
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
