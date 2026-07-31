import {
  buildSioaSearchParams,
  getDeclaredDimensions,
  getPrimaryMedia,
  mapAssetItem,
} from './si-oa.utils'
import type { SioaSearchFilters } from '@/domain/search/providers/si-oa-filters'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { Asset } from '@/domain/asset/asset.schema'
import type { SioaAssetItem } from '@/integrations/si-oa/types'
import type { BaseProvider } from '../../provider'
import type { SearchQuery } from '@/domain/search/search.schema'
import {
  PROVIDER_CAPABILITIES,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { sioaSearchFiltersSchema } from '@/domain/search/providers/si-oa-filters'
import {
  calculateNextPage,
  pageNumberCursor,
} from '@/domain/pagination/pagination.utils'
import {
  getContent as sioaGetContent,
  getImageInfo as sioaGetImageInfo,
  search as sioaSearch,
} from '@/integrations/si-oa/client'
import { getProviderFixtureMode } from '@/integrations/provider-fixtures'

// the provider map is built at module scope so a deployment missing this
// key fails at startup rather than on its first Smithsonian request; replay
// is the one context where no request reaches the network to use it
export function getApiKey() {
  const apiKey = process.env.SI_OA_API_KEY
  if (!apiKey) {
    if (getProviderFixtureMode() === 'replay') {
      return 'fixture-replay'
    }
    throw new Error(
      'SI_OA API key is required. Please set the SI_OA_API_KEY environment variable.',
    )
  }
  return apiKey
}

// About one record in nine declares no size on any resource, and the aspect
// ratio drives row breaking in the grid, so the delivery service is asked
// directly. A record that already declares one costs nothing.
async function resolveMaster(assetItem: SioaAssetItem) {
  const media = getPrimaryMedia(assetItem)
  const declared = getDeclaredDimensions(media)
  if (declared || !media?.idsId) return declared
  try {
    return await sioaGetImageInfo(media.idsId)
  } catch {
    // one unreachable master must not fail a page of results; the mapper
    // falls back to whatever the labelled resources can support
    return undefined
  }
}

async function mapWithMaster(assetItem: SioaAssetItem) {
  return mapAssetItem(assetItem, await resolveMaster(assetItem))
}

export function makeSiOaAdapter(
  apiKey: string,
): BaseProvider<typeof SI_OA_PROVIDER_ID, typeof sioaSearchFiltersSchema> {
  return {
    getProviderId: () => SI_OA_PROVIDER_ID,
    capabilities: PROVIDER_CAPABILITIES[SI_OA_PROVIDER_ID],
    getSearchFiltersSchema: () => sioaSearchFiltersSchema,
    getAsset: async function (id: string) {
      const sioaResponse = await sioaGetContent(id, apiKey)
      const response: Asset = await mapWithMaster(sioaResponse.response)
      return response
    },

    searchAssets: async function (
      query: SearchQuery,
      filters: SioaSearchFilters,
      pagination: Pagination,
    ) {
      const sioaSearchParams = buildSioaSearchParams(query, filters, pagination)
      const sioaResponse = await sioaSearch(sioaSearchParams, apiKey)
      const assets = await Promise.all(
        sioaResponse.response.rows.map(mapWithMaster),
      )
      const total = sioaResponse.response.rowCount
      const next = pageNumberCursor(calculateNextPage(pagination, total))
      const response: PaginatedCollection<Asset> = {
        items: assets,
        pagination: { next, total },
      }
      return response
    },
  }
}
