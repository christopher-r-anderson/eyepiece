import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import {
  makeAssetPreviewSnapshotsRepo,
  useAssetPreviewSnapshotsRepo,
} from './asset-preview-snapshots.repo'
import { assetsKeys } from './assets.queries'
import type { QueryClient } from '@tanstack/react-query'
import type { AssetPreviewSnapshotsRepo } from './asset-preview-snapshots.repo'
import type {
  AssetPreviewSnapshot,
  AssetPreviewSnapshotId,
} from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { unwrapOrThrow } from '@/lib/result'

const assetPreviewSnapshotsKeys = {
  all: [...assetsKeys.all, 'previewSnapshots'] as const,
  byId: (id: AssetPreviewSnapshotId) =>
    [...assetPreviewSnapshotsKeys.all, 'byId', id] as const,
  batch: (ids: Array<AssetPreviewSnapshotId>) =>
    [...assetPreviewSnapshotsKeys.all, 'batch', ids] as const,
}

export function getAssetPreviewSnapshotsBatchOptions({
  assetPreviewSnapshotIds,
  repo,
}: {
  assetPreviewSnapshotIds: Array<AssetPreviewSnapshotId>
  repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'>
}) {
  return queryOptions({
    queryKey: assetPreviewSnapshotsKeys.batch(assetPreviewSnapshotIds),
    placeholderData: keepPreviousData,
    queryFn: async ({ client }) => {
      const toFetch = assetPreviewSnapshotIds.filter(
        (id) =>
          !client.getQueryData<AssetPreviewSnapshot>(
            assetPreviewSnapshotsKeys.byId(id),
          ),
      )
      if (toFetch.length > 0) {
        const result = await repo.getAssetPreviewSnapshots(toFetch)
        const newSnapshots = unwrapOrThrow(result)
        for (const snapshot of newSnapshots) {
          client.setQueryData<AssetPreviewSnapshot>(
            assetPreviewSnapshotsKeys.byId(snapshot.id),
            snapshot,
          )
        }
      }
      return assetPreviewSnapshotIds.map((id) => {
        const snapshot = client.getQueryData<AssetPreviewSnapshot>(
          assetPreviewSnapshotsKeys.byId(id),
        )
        if (!snapshot) {
          throw new Error(`AssetPreviewSnapshot not found for id: ${id}`)
        }
        return snapshot
      })
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useAssetPreviewSnapshotsBatch(
  assetPreviewSnapshotIds: Array<AssetPreviewSnapshotId> = [],
) {
  const repo = useAssetPreviewSnapshotsRepo()
  return useQuery(
    getAssetPreviewSnapshotsBatchOptions({
      assetPreviewSnapshotIds: assetPreviewSnapshotIds,
      repo,
    }),
  )
}

export function ensureAssetPreviewSnapshotsBatch({
  assetPreviewSnapshotIds,
  queryClient,
  publicSupabaseClient,
}: {
  assetPreviewSnapshotIds: Array<AssetPreviewSnapshotId>
  queryClient: QueryClient
  publicSupabaseClient: SupabaseClient
}) {
  const repo = makeAssetPreviewSnapshotsRepo(publicSupabaseClient)
  return queryClient.ensureQueryData(
    getAssetPreviewSnapshotsBatchOptions({
      assetPreviewSnapshotIds,
      repo,
    }),
  )
}
