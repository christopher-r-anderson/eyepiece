import { useMemo } from 'react'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import { useEyepieceClient } from '@/lib/eyepiece-api-client/eyepiece-client-provider'

export interface SearchRepo {
  searchImages: (
    query: SearchQuery,
    filters: SearchFilters,
    pagination: Pagination,
  ) => Promise<PaginatedCollection<Asset>>
}

export function makeSearchRepo(client: EyepieceClient) {
  return {
    searchImages: async (
      query: SearchQuery,
      filters: SearchFilters,
      pagination: Pagination,
    ) => {
      return await client.searchAssets(query, filters, pagination)
    },
  }
}

export function useSearchRepo() {
  const client = useEyepieceClient()
  return useMemo(() => makeSearchRepo(client), [client])
}
