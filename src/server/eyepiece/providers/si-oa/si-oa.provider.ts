import { calculateNextPage } from '../../provider.utils'
import { buildSioaSearchParams, mapAssetItem } from './si-oa.utils'
import type { SioaSearchFilters } from '@/domain/search/providers/si-oa-filters'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import type { BaseProvider } from '../../provider'
import type { SearchQuery } from '@/domain/search/search.schema'
import { sioaSearchFiltersSchema } from '@/domain/search/providers/si-oa-filters'
import {
  getContent as sioaGetContent,
  search as sioaSearch,
} from '@/integrations/si-oa/client'
import { SI_OA_PROVIDER_ID } from '@/domain/provider/provider.schema'

export function getApiKey() {
  const apiKey = process.env.SI_OA_API_KEY
  if (!apiKey) {
    throw new Error(
      'SI_OA API key is required. Please set the SI_OA_API_KEY environment variable.',
    )
  }
  return apiKey
}

export function makeSiOaAdapter(
  apiKey: string,
): BaseProvider<typeof SI_OA_PROVIDER_ID, typeof sioaSearchFiltersSchema> {
  return {
    getProviderId: () => SI_OA_PROVIDER_ID,
    getSearchFiltersSchema: () => sioaSearchFiltersSchema,
    getAsset: async function (id: string) {
      const sioaResponse = await sioaGetContent(id, apiKey)
      const response: Asset = mapAssetItem(sioaResponse.response)
      return response
    },

    searchAssets: async function (
      query: SearchQuery,
      filters: SioaSearchFilters,
      pagination: Pagination,
    ) {
      const sioaSearchParams = buildSioaSearchParams(query, filters, pagination)
      const sioaResponse = await sioaSearch(sioaSearchParams, apiKey)
      const assets = sioaResponse.response.rows.map(mapAssetItem)
      const total = sioaResponse.response.rowCount
      const next = calculateNextPage(pagination, assets.length, total)
      const response: PaginatedCollection<Asset> = {
        items: assets,
        pagination: { next, total },
      }
      return response
    },
  }
}
