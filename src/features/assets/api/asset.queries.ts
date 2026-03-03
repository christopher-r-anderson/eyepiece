import { queryOptions, useQuery } from '@tanstack/react-query'
import type { AssetKey, AssetKeyString } from '@/domain/asset/asset.schemas'
import type { AssetsRepo } from '../assets-repo'
import { toAssetKeyString } from '@/domain/asset/asset.util'

type AssetCacheKey = ['assets', AssetKeyString]

function assetCacheKey(assetKey: AssetKey): AssetCacheKey {
  return ['assets', toAssetKeyString(assetKey)] as const
}

export function getAssetOptions({
  repo,
  assetKey,
}: {
  repo: Pick<AssetsRepo, 'getAsset'>
  assetKey: AssetKey
}) {
  return queryOptions({
    queryKey: assetCacheKey(assetKey),
    queryFn: () => {
      return repo.getAsset(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useAsset({
  repo,
  assetKey,
}: {
  repo: Pick<AssetsRepo, 'getAsset'>
  assetKey: AssetKey
}) {
  return useQuery(getAssetOptions({ repo, assetKey }))
}

type MetadataCacheKey = ['assets', AssetKeyString, 'metadata']

function metadataCacheKey(assetKey: AssetKey): MetadataCacheKey {
  return ['assets', toAssetKeyString(assetKey), 'metadata'] as const
}

export function getMetadataOptions({
  repo,
  assetKey,
}: {
  repo: Pick<AssetsRepo, 'getMetadata'>
  assetKey: AssetKey
}) {
  return queryOptions({
    queryKey: metadataCacheKey(assetKey),
    queryFn: () => {
      return repo.getMetadata(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useMetadata({
  repo,
  assetKey,
  enabled,
}: {
  repo: Pick<AssetsRepo, 'getMetadata'>
  assetKey: AssetKey
  enabled?: boolean
}) {
  return useQuery({
    ...getMetadataOptions({ repo, assetKey }),
    enabled,
  })
}
