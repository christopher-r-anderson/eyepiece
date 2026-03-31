import * as nasaIvlAdapter from './providers/nasa-ivl/nasa-ivl.provider'
import * as sioaAdapter from './providers/si-oa/si-oa.provider'
import { hasAlbums, hasMetadata } from './provider'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import type { Pagination } from '@/domain/pagination/pagination.schema'
import type { AssetKey } from '@/domain/asset/asset.schema'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'

const PROVIDERS_MAP = {
  // while the other nasa apis use an api key, the IVL does not support them
  [NASA_IVL_PROVIDER_ID]: nasaIvlAdapter.makeNasaIvlAdapter(),
  [SI_OA_PROVIDER_ID]: sioaAdapter.makeSiOaAdapter(sioaAdapter.getApiKey()),
} as const

function getProvider<TProviderId extends ProviderId>(providerId: TProviderId) {
  return PROVIDERS_MAP[providerId]
}

export function makeEyepieceProviderService() {
  return {
    getAlbum: async function getAlbum(
      assetKey: AssetKey,
      pagination: Pagination,
    ) {
      const provider = getProvider(assetKey.providerId)
      if (hasAlbums(provider)) {
        return await provider.getAlbum(assetKey.externalId, pagination)
      }
      return null
    },
    getAsset: async function getAsset(assetKey: AssetKey) {
      return await getProvider(assetKey.providerId).getAsset(
        assetKey.externalId,
      )
    },
    getMetadata: async function getMetadata(assetKey: AssetKey) {
      const provider = getProvider(assetKey.providerId)
      if (hasMetadata(provider)) {
        return await provider.getMetadata(assetKey.externalId)
      }
      return null
    },
    searchAssets: async function searchAssets(
      query: SearchQuery,
      filters: SearchFilters,
      pagination: Pagination,
    ) {
      switch (filters.providerId) {
        case NASA_IVL_PROVIDER_ID:
          return await getProvider(filters.providerId).searchAssets(
            query,
            filters.filters,
            pagination,
          )
        case SI_OA_PROVIDER_ID:
          return await getProvider(filters.providerId).searchAssets(
            query,
            filters.filters,
            pagination,
          )
      }
    },
  }
}
