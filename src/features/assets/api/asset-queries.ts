import { getAsset, getMetadata } from '@/lib/api/eyepiece/client'
import { queryOptions, useQuery } from '@tanstack/react-query'

type AssetCacheKey = ['assets', string]

export function getAssetOptions(id: string) {
  return queryOptions({
    queryKey: ['assets', id] as AssetCacheKey,
    queryFn: ({ queryKey }) => {
      return getAsset(queryKey[1])
    },
  })
}

export function useAsset(id: string) {
  return useQuery(getAssetOptions(id))
}

type MetadataCacheKey = ['assets', string, 'metadata']

export function getMetadataOptions(id: string) {
  return queryOptions({
    queryKey: ['assets', id, 'metadata'] as MetadataCacheKey,
    queryFn: ({ queryKey }) => {
      return getMetadata(queryKey[1])
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useMetadata(id: string, enabled?: boolean) {
  return useQuery({
    ...getMetadataOptions(id),
    enabled,
  })
}
