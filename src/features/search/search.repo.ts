import { useMemo } from 'react'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type {
  CursorPageRequest,
  PaginatedCollection,
} from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'

export interface SearchRepo {
  searchImages: (
    query: SearchQuery,
    filters: SearchFilters,
    page: CursorPageRequest,
  ) => Promise<PaginatedCollection<Asset>>
}

export function makeSearchRepo(client: EyepieceClient) {
  return {
    searchImages: async (
      query: SearchQuery,
      filters: SearchFilters,
      page: CursorPageRequest,
    ) => {
      return await client.searchAssets(query, filters, page)
    },
  }
}

export function useSearchRepo() {
  const client = useEyepieceClient()
  return useMemo(() => makeSearchRepo(client), [client])
}
