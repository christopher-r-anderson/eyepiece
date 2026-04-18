import * as nasaIvlAdapter from './providers/nasa-ivl/nasa-ivl.provider'
import * as sioaAdapter from './providers/si-oa/si-oa.provider'
import { hasAlbums, hasMetadata } from './provider'
import type { Asset, AssetKey, Metadata } from '@/domain/asset/asset.schema'
import type { ProviderId } from '@/domain/provider/provider.schema'
import type { SearchFilters, SearchQuery } from '@/domain/search/search.schema'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import { AppException } from '@/lib/result'
import { operationalErrorObservability } from '@/lib/error-observability'
import {
  NASA_IVL_PROVIDER_ID,
  SI_OA_PROVIDER_ID,
} from '@/domain/provider/provider.schema'
import { isProviderClientError } from '@/integrations/provider-client-error'

const PROVIDERS_MAP = {
  // while the other nasa apis use an api key, the IVL does not support them
  [NASA_IVL_PROVIDER_ID]: nasaIvlAdapter.makeNasaIvlAdapter(),
  [SI_OA_PROVIDER_ID]: sioaAdapter.makeSiOaAdapter(sioaAdapter.getApiKey()),
} as const

function getProvider<TProviderId extends ProviderId>(providerId: TProviderId) {
  return PROVIDERS_MAP[providerId]
}

type ProviderOperation =
  | 'album.fetch'
  | 'asset.fetch'
  | 'metadata.fetch'
  | 'search.fetch'

function isNotFoundProviderError(error: unknown) {
  return (
    isProviderClientError(error) &&
    (error.kind === 'not_found' || error.status === 404)
  )
}

function toProviderAppException(
  providerId: ProviderId,
  operation: ProviderOperation,
  error: unknown,
  context: Record<string, string | number | boolean | null> = {},
) {
  return new AppException({
    code: 'PROVIDER_REQUEST_FAILED',
    message: `Provider request failed during ${operation}`,
    cause: error,
    observability: operationalErrorObservability({
      tags: {
        feature: 'providers',
        operation,
        'provider.id': providerId,
      },
      context: {
        ...context,
        ...(isProviderClientError(error)
          ? {
              'provider.request.operation': error.operation,
              'provider.request.status': error.status ?? null,
              'provider.request.url': error.url,
              ...error.context,
            }
          : {}),
      },
    }),
  })
}

async function runProviderOperation<T>({
  providerId,
  operation,
  context,
  run,
  onNotFound,
}: {
  providerId: ProviderId
  operation: ProviderOperation
  context?: Record<string, string | number | boolean | null>
  run: () => Promise<T>
  onNotFound?: () => T
}): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (onNotFound && isNotFoundProviderError(error)) {
      return onNotFound()
    }

    throw toProviderAppException(providerId, operation, error, context)
  }
}

export function makeEyepieceProviderService() {
  return {
    getAlbum: async function getAlbum(
      assetKey: AssetKey,
      pagination: Pagination,
    ): Promise<PaginatedCollection<Asset> | null> {
      const provider = getProvider(assetKey.providerId)
      if (hasAlbums(provider)) {
        return await runProviderOperation({
          providerId: assetKey.providerId,
          operation: 'album.fetch',
          context: {
            'asset.externalId': assetKey.externalId,
          },
          run: () => provider.getAlbum(assetKey.externalId, pagination),
          onNotFound: () => null,
        })
      }
      return null
    },
    getAsset: async function getAsset(
      assetKey: AssetKey,
    ): Promise<Asset | null> {
      return await runProviderOperation({
        providerId: assetKey.providerId,
        operation: 'asset.fetch',
        context: {
          'asset.externalId': assetKey.externalId,
        },
        run: () =>
          getProvider(assetKey.providerId).getAsset(assetKey.externalId),
        onNotFound: () => null,
      })
    },
    getMetadata: async function getMetadata(
      assetKey: AssetKey,
    ): Promise<Metadata | null> {
      const provider = getProvider(assetKey.providerId)
      if (hasMetadata(provider)) {
        return await runProviderOperation({
          providerId: assetKey.providerId,
          operation: 'metadata.fetch',
          context: {
            'asset.externalId': assetKey.externalId,
          },
          run: () => provider.getMetadata(assetKey.externalId),
          onNotFound: () => null,
        })
      }
      return {}
    },
    searchAssets: async function searchAssets(
      query: SearchQuery,
      filters: SearchFilters,
      pagination: Pagination,
    ) {
      return await runProviderOperation({
        providerId: filters.providerId,
        operation: 'search.fetch',
        context: {
          query,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
        run: async () => {
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
      })
    },
  }
}
