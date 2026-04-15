import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { getAssetPreviewSnapshotsBatchOptions } from './asset-preview-snapshots.queries'
import type { AssetPreviewSnapshotsRepo } from './asset-preview-snapshots.repo'
import type { AssetPreviewSnapshot } from '@/domain/asset/asset.schema'
import { Err, Ok } from '@/lib/result'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ID_1 = '00000000-0000-0000-0000-000000000001'
const ID_2 = '00000000-0000-0000-0000-000000000002'

function makeSnapshot(id: string, externalId: string): AssetPreviewSnapshot {
  return {
    id,
    key: { providerId: NASA_IVL_PROVIDER_ID, externalId },
    title: `Snapshot ${externalId}`,
    thumbnail: {
      href: 'https://example.com/thumb.jpg',
      width: 200,
      height: 150,
    },
  }
}

function runQueryFn(
  options: ReturnType<typeof getAssetPreviewSnapshotsBatchOptions>,
  client: QueryClient,
) {
  return (options.queryFn as any)({ client })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAssetPreviewSnapshotsBatchOptions', () => {
  describe('cold fetch', () => {
    it('fetches all IDs from the repo when none are cached', async () => {
      const snap1 = makeSnapshot(ID_1, 'asset-1')
      const snap2 = makeSnapshot(ID_2, 'asset-2')
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots: vi
            .fn()
            .mockResolvedValue(Ok([snap1, snap2])),
        }

      const client = new QueryClient()
      const result = await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1, ID_2],
          repo,
        }),
        client,
      )

      expect(repo.getAssetPreviewSnapshots).toHaveBeenCalledWith([ID_1, ID_2])
      expect(result).toEqual([snap1, snap2])
    })

    it('populates individual snapshot cache entries so a second call skips the repo', async () => {
      const snap1 = makeSnapshot(ID_1, 'asset-1')
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots: vi.fn().mockResolvedValue(Ok([snap1])),
        }

      const client = new QueryClient()

      await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1],
          repo,
        }),
        client,
      )

      // Shouldn't call repo again
      await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1],
          repo,
        }),
        client,
      )

      expect(repo.getAssetPreviewSnapshots).toHaveBeenCalledOnce()
    })
  })

  describe('full cache hit', () => {
    it('skips the repo entirely when all snapshots are already cached', async () => {
      const snap1 = makeSnapshot(ID_1, 'asset-1')
      const snap2 = makeSnapshot(ID_2, 'asset-2')
      const getAssetPreviewSnapshots = vi
        .fn()
        .mockResolvedValue(Ok([snap1, snap2]))
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots,
        }

      const client = new QueryClient()

      // First call primes the cache
      await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1, ID_2],
          repo,
        }),
        client,
      )
      getAssetPreviewSnapshots.mockClear()

      // Second call should be served entirely from cache
      const result = await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1, ID_2],
          repo,
        }),
        client,
      )

      expect(getAssetPreviewSnapshots).not.toHaveBeenCalled()
      expect(result).toEqual([snap1, snap2])
    })
  })

  describe('partial cache hit', () => {
    it('fetches only uncached IDs and merges results from cache', async () => {
      const snap1 = makeSnapshot(ID_1, 'asset-1')
      const snap2 = makeSnapshot(ID_2, 'asset-2')
      const getAssetPreviewSnapshots = vi.fn()
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots,
        }

      const client = new QueryClient()

      // Prime the cache with only ID_1
      getAssetPreviewSnapshots.mockResolvedValueOnce(Ok([snap1]))
      await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1],
          repo,
        }),
        client,
      )
      getAssetPreviewSnapshots.mockClear()

      // Request [ID_1, ID_2] shouldn't call ID_1 again
      getAssetPreviewSnapshots.mockResolvedValueOnce(Ok([snap2]))
      const result = await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1, ID_2],
          repo,
        }),
        client,
      )

      expect(getAssetPreviewSnapshots).toHaveBeenCalledWith([ID_2])
      expect(result).toEqual([snap1, snap2])
    })

    it('returns results in input ID order regardless of repo response order', async () => {
      const snap1 = makeSnapshot(ID_1, 'asset-1')
      const snap2 = makeSnapshot(ID_2, 'asset-2')
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          // repo returns snapshots in reversed order
          getAssetPreviewSnapshots: vi
            .fn()
            .mockResolvedValue(Ok([snap2, snap1])),
        }

      const client = new QueryClient()
      const result = await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [ID_1, ID_2],
          repo,
        }),
        client,
      )

      expect(result[0]).toEqual(snap1)
      expect(result[1]).toEqual(snap2)
    })
  })

  describe('edge cases', () => {
    it('returns an empty array and does not call the repo when given no IDs', async () => {
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots: vi.fn(),
        }

      const client = new QueryClient()
      const result = await runQueryFn(
        getAssetPreviewSnapshotsBatchOptions({
          assetPreviewSnapshotIds: [],
          repo,
        }),
        client,
      )

      expect(repo.getAssetPreviewSnapshots).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('throws when the repo returns an error result', async () => {
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots: vi
            .fn()
            .mockResolvedValue(Err({ message: 'Database error' })),
        }

      const client = new QueryClient()

      await expect(
        runQueryFn(
          getAssetPreviewSnapshotsBatchOptions({
            assetPreviewSnapshotIds: [ID_1],
            repo,
          }),
          client,
        ),
      ).rejects.toThrow('Database error')
    })

    it('throws when the repo returns fewer snapshots than requested', async () => {
      const repo: Pick<AssetPreviewSnapshotsRepo, 'getAssetPreviewSnapshots'> =
        {
          getAssetPreviewSnapshots: vi.fn().mockResolvedValue(Ok([])),
        }

      const client = new QueryClient()

      await expect(
        runQueryFn(
          getAssetPreviewSnapshotsBatchOptions({
            assetPreviewSnapshotIds: [ID_1],
            repo,
          }),
          client,
        ),
      ).rejects.toThrow(ID_1)
    })
  })
})
