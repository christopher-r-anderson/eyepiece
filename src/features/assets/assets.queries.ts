import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useCallback } from 'react'
import { makeAssetsRepo, useAssetsRepo } from './assets.repo'
import type { AssetsRepo } from './assets.repo'
import type { QueryClient } from '@tanstack/react-query'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { EyepieceClient } from '@/lib/eyepiece-api-client/client'

export const assetsKeys = {
  all: ['assets'] as const,
  asset: (assetKey: AssetKey) =>
    [...assetsKeys.all, 'detail', assetKey] as const,
  metadata: (assetKey: AssetKey) =>
    [...assetsKeys.asset(assetKey), 'metadata'] as const,
}

export function getAssetOptions({
  repo,
  assetKey,
}: {
  repo: Pick<AssetsRepo, 'getAsset'>
  assetKey: AssetKey
}) {
  return queryOptions({
    queryKey: assetsKeys.asset(assetKey),
    queryFn: () => {
      return repo.getAsset(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useSuspenseAsset(assetKey: AssetKey) {
  const repo = useAssetsRepo()
  return useSuspenseQuery(getAssetOptions({ repo, assetKey }))
}

export function ensureAsset({
  assetKey,
  queryClient,
  eyepieceClient,
}: {
  assetKey: AssetKey
  queryClient: QueryClient
  eyepieceClient: EyepieceClient
}) {
  const repo = makeAssetsRepo(eyepieceClient)
  return queryClient.ensureQueryData(getAssetOptions({ repo, assetKey }))
}

export function getMetadataOptions({
  repo,
  assetKey,
}: {
  repo: Pick<AssetsRepo, 'getMetadata'>
  assetKey: AssetKey
}) {
  return queryOptions({
    queryKey: assetsKeys.metadata(assetKey),
    queryFn: () => {
      return repo.getMetadata(assetKey)
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useSuspenseMetadata(assetKey: AssetKey) {
  const repo = useAssetsRepo()
  return useSuspenseQuery(getMetadataOptions({ repo, assetKey }))
}

export function usePrefetchMetadata(assetKey: AssetKey) {
  const repo = useAssetsRepo()
  const queryClient = useQueryClient()

  return useCallback(() => {
    // NOTE: this gets spammed on every hover/focus/press - add throttle if staleTime is removed
    void queryClient.prefetchQuery(getMetadataOptions({ repo, assetKey }))
  }, [repo, queryClient, assetKey])
}
