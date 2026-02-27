import { queryOptions, useQuery } from '@tanstack/react-query'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'
import type { AssetKey, AssetKeyString } from '@/domain/asset/asset.schemas'
import { toAssetKeyString } from '@/domain/asset/asset.util'

type AssetCacheKey = ['assets', AssetKeyString]

function assetCacheKey(assetKey: AssetKey): AssetCacheKey {
  return ['assets', toAssetKeyString(assetKey)] as const
}

export function getAssetOptions(client: EyepieceClient, assetKey: AssetKey) {
  return queryOptions({
    queryKey: assetCacheKey(assetKey),
    queryFn: () => {
      return client.getAsset(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useAsset(client: EyepieceClient, assetKey: AssetKey) {
  return useQuery(getAssetOptions(client, assetKey))
}

type MetadataCacheKey = ['assets', AssetKeyString, 'metadata']

function metadataCacheKey(assetKey: AssetKey): MetadataCacheKey {
  return ['assets', toAssetKeyString(assetKey), 'metadata'] as const
}

export function getMetadataOptions(client: EyepieceClient, assetKey: AssetKey) {
  return queryOptions({
    queryKey: metadataCacheKey(assetKey),
    queryFn: () => {
      return client.getMetadata(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useMetadata(
  client: EyepieceClient,
  assetKey: AssetKey,
  enabled?: boolean,
) {
  return useQuery({
    ...getMetadataOptions(client, assetKey),
    enabled,
  })
}
