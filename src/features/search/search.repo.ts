import { useMemo } from 'react'
import type {
  EyepieceAssetCollectionResponse,
  EyepiecePageSearchParams,
} from '@/lib/eyepiece-api-client/types'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type { SearchQuery, SearchResults } from './search.types'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'

function searchQueryToEyepieceSearchParams(
  query: SearchQuery,
): EyepiecePageSearchParams {
  return query
}

function eyepieceSearchResponseToSearchResults(
  response: EyepieceAssetCollectionResponse,
): SearchResults {
  return response
}

export interface SearchRepo {
  searchImages: (query: SearchQuery) => Promise<SearchResults>
}

export function makeSearchRepo(client: EyepieceClient) {
  return {
    searchImages: async (query: SearchQuery) => {
      const searchParams = searchQueryToEyepieceSearchParams(query)
      const response = await client.searchImages(searchParams)
      return eyepieceSearchResponseToSearchResults(response)
    },
  }
}

export function useSearchRepo() {
  const client = useEyepieceClient()
  return useMemo(() => makeSearchRepo(client), [client])
}
