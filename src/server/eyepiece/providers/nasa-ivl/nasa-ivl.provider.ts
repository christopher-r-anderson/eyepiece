import { calculateNextPage } from '../../provider.utils'
import {
  buildNasaIvlSearchParams,
  calculateNasaAlbumRequests,
  mapMediaItem,
} from './nasa-ivl.utils'
import type {
  AlbumsCapability,
  BaseProvider,
  MetadataCapability,
} from '../../provider'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { Asset, Metadata } from '@/domain/asset/asset.schema'
import type { SearchQuery } from '@/domain/search/search.schema'
import type { NasaIvlSearchFilters } from '@/domain/search/providers/nasa-ivl-filters'
import {
  getAlbum as nasaIvlGetAlbum,
  getMetadata as nasaIvlGetMetadata,
  search as nasaIvlSearch,
} from '@/integrations/nasa-ivl/client'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { nasaIvlSearchFiltersSchema } from '@/domain/search/providers/nasa-ivl-filters'

export function makeNasaIvlAdapter(): BaseProvider<
  typeof NASA_IVL_PROVIDER_ID,
  typeof nasaIvlSearchFiltersSchema
> &
  AlbumsCapability &
  MetadataCapability {
  return {
    getProviderId: () => NASA_IVL_PROVIDER_ID,
    getSearchFiltersSchema: () => nasaIvlSearchFiltersSchema,
    getAlbum,
    getAsset,
    getMetadata,
    searchAssets,
  }
}

async function getAlbum(id: string, pagination: Pagination) {
  // NASA Albums do not support page size, instead always returning 100 items per page
  // Therefore, we need to calculate which NASA album pages to fetch
  // and slice the results accordingly
  const plans = calculateNasaAlbumRequests(pagination.page, pagination.pageSize)
  const responses = await Promise.all(
    plans.map((plan) => nasaIvlGetAlbum(id, { page: plan.page })),
  )

  const total = responses[0].collection.metadata.total_hits
  const assets = []
  for (const [index, response] of responses.entries()) {
    const plan = plans[index]
    assets.push(
      ...response.collection.items
        .slice(plan.sliceStart, plan.sliceEnd)
        .map(mapMediaItem),
    )
  }
  const next = calculateNextPage(pagination, assets.length, total)
  const response: PaginatedCollection<Asset> = {
    items: assets,
    pagination: { next, total },
  }
  return response
}

async function getAsset(id: string): Promise<Asset> {
  // NOTE: use search + nasa_id because the only other "detail" endpoint is the
  // metadata.json file which contains a lot of duplicate and extraneous data
  // It does contain line breaks in descriptions, which we are currently opting to do without
  const nasaResponse = await nasaIvlSearch({
    nasa_id: id,
  })
  if (nasaResponse.collection.items.length !== 1) {
    throw new Error(`Asset not found: ${id}`)
  }
  const item = nasaResponse.collection.items[0]
  return mapMediaItem(item)
}

async function searchAssets(
  query: SearchQuery,
  filters: NasaIvlSearchFilters,
  pagination: Pagination,
) {
  const nasaSearchParams = buildNasaIvlSearchParams(query, filters, pagination)
  const nasaResponse = await nasaIvlSearch(nasaSearchParams)
  const assets = nasaResponse.collection.items.map(mapMediaItem)
  const total = nasaResponse.collection.metadata.total_hits
  const next = calculateNextPage(pagination, assets.length, total)
  const response: PaginatedCollection<Asset> = {
    items: assets,
    pagination: { next, total },
  }
  return response
}

async function getMetadata(id: string): Promise<Metadata> {
  return await nasaIvlGetMetadata(id)
}
