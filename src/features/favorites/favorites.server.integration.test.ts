import { afterEach, describe, expect, vi } from 'vitest'
import { _internals } from './favorites.server'
import { ToggleFavoriteErrorCodes } from './favorites.const'
import type { AssetPreviewSnapshotId } from '@/domain/asset/asset.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// favorites.server.ts calls createServerOnlyFn() at module scope.
// Without the TanStack Start build plugin (as in tests) it is a passthrough
// at runtime, but we mock it explicitly here for clarity and to prevent any
// edge-case issues in the node test environment.
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()

  return {
    ...actual,
    createServerOnlyFn: (fn: unknown) => fn,
    createServerFn: () => ({ handler: (fn: unknown) => fn }),
    // Required by src/lib/utils.ts during module evaluation.
    createIsomorphicFn: () => ({
      server: (serverImpl: unknown) => ({
        client: () => serverImpl,
      }),
    }),
  }
})

// These factories are imported at module scope but only called inside the
// createServerOnlyFn bodies that we never invoke in these tests.
vi.mock('@/integrations/supabase/service', () => ({
  createServiceSupabaseClient: vi.fn(),
}))
vi.mock('@/integrations/supabase/user', () => ({
  createUserSupabaseClient: vi.fn(),
}))
vi.mock('@/features/auth/get-user', () => ({
  getUser: vi.fn(),
}))

const { toggleFavoriteForUser } = _internals

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedAssetSummary(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string,
): Promise<AssetPreviewSnapshotId> {
  const { data, error } = await admin
    .from('asset_preview_snapshots')
    .insert({
      provider_id: 'nasa_ivl',
      external_id: externalId,
      title: `Integration test asset ${externalId}`,
      thumb_href: 'https://images.example.com/thumb.jpg',
      thumb_width: 200,
      thumb_height: 150,
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedAssetSummary: ${error.message}`)
  return data.id
}

async function getFavoritesCount(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  assetSummaryId: AssetPreviewSnapshotId,
): Promise<number> {
  const { count, error } = await admin
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
    .eq('asset_preview_snapshot_id', assetSummaryId)
  if (error) throw new Error(`getFavoritesCount: ${error.message}`)
  return count ?? 0
}

async function cleanupAssetSummaries(
  ids: Array<AssetPreviewSnapshotId>,
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await createAdminClient()
    .from('asset_preview_snapshots')
    .delete()
    .in('id', ids)
  if (error) console.error('Failed to clean up asset_preview_snapshots:', error)
}

// ---------------------------------------------------------------------------
// toggleFavoriteForUser
// ---------------------------------------------------------------------------

describe('toggleFavoriteForUser', () => {
  const summaryIds: Array<AssetPreviewSnapshotId> = []

  afterEach(async () => {
    await cleanupAssetSummaries(summaryIds)
    summaryIds.length = 0
  })

  it('inserts a favorites row and returns isFavorited: true when no row exists', async ({
    client,
    user,
    adminClient,
  }) => {
    const summaryId = await seedAssetSummary(
      adminClient,
      `INTEG-SRV-ADD-${Date.now()}`,
    )
    summaryIds.push(summaryId)

    const result = await toggleFavoriteForUser(client, user.id, summaryId)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        assetSummaryId: summaryId,
        isFavorited: true,
      })
    }
    // Verify the row actually exists in the DB
    expect(await getFavoritesCount(adminClient, user.id, summaryId)).toBe(1)
  })

  it('deletes the favorites row and returns isFavorited: false when a row exists', async ({
    client,
    user,
    adminClient,
  }) => {
    const summaryId = await seedAssetSummary(
      adminClient,
      `INTEG-SRV-DEL-${Date.now()}`,
    )
    summaryIds.push(summaryId)
    // Seed the pre-existing favorite
    await adminClient
      .from('favorites')
      .insert({ owner_id: user.id, asset_preview_snapshot_id: summaryId })

    const result = await toggleFavoriteForUser(client, user.id, summaryId)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual({
        assetSummaryId: summaryId,
        isFavorited: false,
      })
    }
    // Verify the row is gone from the DB
    expect(await getFavoritesCount(adminClient, user.id, summaryId)).toBe(0)
  })

  it('toggling twice restores the original state', async ({
    client,
    user,
    adminClient,
  }) => {
    const summaryId = await seedAssetSummary(
      adminClient,
      `INTEG-SRV-TWICE-${Date.now()}`,
    )
    summaryIds.push(summaryId)

    const add = await toggleFavoriteForUser(client, user.id, summaryId)
    const remove = await toggleFavoriteForUser(client, user.id, summaryId)

    expect(resultIsSuccess(add)).toBe(true)
    if (resultIsSuccess(add)) expect(add.data.isFavorited).toBe(true)
    expect(resultIsSuccess(remove)).toBe(true)
    if (resultIsSuccess(remove)) expect(remove.data.isFavorited).toBe(false)
    expect(await getFavoritesCount(adminClient, user.id, summaryId)).toBe(0)
  })

  it('returns Err when the asset_preview_snapshot_id does not exist (FK violation)', async ({
    client,
    user,
  }) => {
    // This UUID doesn't correspond to any asset_summary row
    const nonExistentId =
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' as AssetPreviewSnapshotId

    const result = await toggleFavoriteForUser(client, user.id, nonExistentId)

    // The insert will fail with a FK violation; the delete returns count=0 first
    // then the insert fails
    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(ToggleFavoriteErrorCodes.UNKNOWN_ERROR)
      expect(result.error.message).toBe(ToggleFavoriteErrorCodes.UNKNOWN_ERROR)
    }
  })
})
