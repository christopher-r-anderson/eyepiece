import * as Sentry from '@sentry/tanstackstart-react'
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
import {
  expectedErrorObservability,
  operationalErrorObservability,
} from '@/lib/error-observability'
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

type ProviderOperationContext = Record<string, string | number | boolean | null>

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

function toUnsupportedProviderOperationException(
  providerId: ProviderId,
  operation: 'album.fetch' | 'metadata.fetch',
) {
  return new AppException({
    code: 'UNSUPPORTED_PROVIDER_OPERATION',
    message: `${operation} is not supported for provider ${providerId}`,
    observability: expectedErrorObservability({
      tags: {
        feature: 'providers',
        operation,
        'provider.id': providerId,
      },
    }),
  })
}

function getProviderSpanAttributes({
  providerId,
  operation,
  context,
}: {
  providerId: ProviderId
  operation: ProviderOperation
  context?: ProviderOperationContext
}) {
  const attributes: Record<string, string | number | boolean> = {
    'eyepiece.provider.id': providerId,
    'eyepiece.provider.operation': operation,
  }

  if (operation !== 'search.fetch' || !context) {
    return attributes
  }

  if (typeof context.page === 'number') {
    attributes['eyepiece.search.page'] = context.page
  }

  if (typeof context.pageSize === 'number') {
    attributes['eyepiece.search.page_size'] = context.pageSize
  }

  if (typeof context.query === 'string') {
    attributes['eyepiece.search.query_length'] = context.query.length
  }

  if (typeof context.hasFilters === 'boolean') {
    attributes['eyepiece.search.has_filters'] = context.hasFilters
  }

  return attributes
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
  context?: ProviderOperationContext
  run: () => Promise<T>
  onNotFound?: () => T
}): Promise<T> {
  return Sentry.startSpan(
    {
      name: `provider.${operation}`,
      op: 'provider.fetch',
      attributes: getProviderSpanAttributes({
        providerId,
        operation,
        context,
      }),
    },
    async (span) => {
      try {
        const result = await run()

        span.setAttribute('eyepiece.provider.result', 'success')

        return result
      } catch (error) {
        if (onNotFound && isNotFoundProviderError(error)) {
          span.setAttribute('eyepiece.provider.result', 'not_found')
          return onNotFound()
        }

        span.setAttribute('eyepiece.provider.result', 'error')

        throw toProviderAppException(providerId, operation, error, context)
      }
    },
  )
}

export function makeEyepieceProviderService() {
  return {
    getAlbum: async function getAlbum(
      assetKey: AssetKey,
      pagination: Pagination,
    ): Promise<PaginatedCollection<Asset> | null> {
      const provider = getProvider(assetKey.providerId)
      if (!hasAlbums(provider)) {
        throw toUnsupportedProviderOperationException(
          assetKey.providerId,
          'album.fetch',
        )
      }

      return await runProviderOperation({
        providerId: assetKey.providerId,
        operation: 'album.fetch',
        context: {
          'asset.externalId': assetKey.externalId,
        },
        run: () => provider.getAlbum(assetKey.externalId, pagination),
        onNotFound: () => null,
      })
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
      if (!hasMetadata(provider)) {
        throw toUnsupportedProviderOperationException(
          assetKey.providerId,
          'metadata.fetch',
        )
      }

      return await runProviderOperation({
        providerId: assetKey.providerId,
        operation: 'metadata.fetch',
        context: {
          'asset.externalId': assetKey.externalId,
        },
        run: () => provider.getMetadata(assetKey.externalId),
        onNotFound: () => null,
      })
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
          hasFilters: Object.keys(filters.filters).length > 0,
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
