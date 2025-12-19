import { searchImagesOptions } from '@/lib/api/eyepiece/client'
import { EyepieceSearchParams } from '@/lib/api/eyepiece/types'
import { useInfiniteQuery } from '@tanstack/react-query'

interface SearchResultsProps {
  searchParams: EyepieceSearchParams
}

export function SearchResults({ searchParams }: SearchResultsProps) {
  const { data, isPending, isError, error } = useInfiniteQuery(
    searchImagesOptions(searchParams),
  )

  if (isPending) {
    return <p>Loading...</p>
  }

  if (isError) {
    return (
      <div>
        <p>Error loading search results</p>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return <div>{data.pages[0].assets.length}</div>
}
