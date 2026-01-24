import { queryOptions, useQuery } from '@tanstack/react-query'
import type { EyepieceClient } from '@/lib/api/eyepiece/client'

type AssetCacheKey = ['assets', string]

export function getAssetOptions(client: EyepieceClient, id: string) {
  return queryOptions({
    queryKey: ['assets', id] as const satisfies AssetCacheKey,
    queryFn: ({ queryKey }) => {
      return client.getAsset(queryKey[1])
    },
  })
}

export function useAsset(client: EyepieceClient, id: string) {
  return useQuery(getAssetOptions(client, id))
}

type MetadataCacheKey = ['assets', string, 'metadata']

export function getMetadataOptions(client: EyepieceClient, id: string) {
  return queryOptions({
    queryKey: ['assets', id, 'metadata'] as const satisfies MetadataCacheKey,
    queryFn: ({ queryKey }) => {
      return client.getMetadata(queryKey[1])
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useMetadata(
  client: EyepieceClient,
  id: string,
  enabled?: boolean,
) {
  return useQuery({
    ...getMetadataOptions(client, id),
    enabled,
  })
}
