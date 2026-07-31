import { afterEach, describe, expect } from 'vitest'
import { makeUserFavoritesRepo } from './favorites.repo'
import type { AssetPreviewSnapshotId } from '@/domain/asset/asset.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'
import { resultIsSuccess, unwrapOrThrow } from '@/lib/result'

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedAssetPreviewSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string,
): Promise<AssetPreviewSnapshotId> {
  const { data, error } = await admin
    .from('asset_preview_snapshots')
    .insert({
      provider_id: 'nasa_ivl',
      external_id: externalId,
      title: `Integration test asset ${externalId}`,
      image_width: 200,
      image_height: 150,
      renditions: [
        {
          href: 'https://images.example.com/thumb.jpg',
          width: 200,
          height: 150,
        },
      ],
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedAssetPreviewSnapshot: ${error.message}`)
  return data.id
}

async function seedFavorite(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  assetPreviewSnapshotId: AssetPreviewSnapshotId,
  createdAt?: string,
): Promise<void> {
  const { error } = await admin.from('favorites').insert({
    owner_id: ownerId,
    asset_preview_snapshot_id: assetPreviewSnapshotId,
    ...(createdAt ? { created_at: createdAt } : {}),
  })
  if (error) throw new Error(`seedFavorite: ${error.message}`)
}

async function cleanupAssetPreviewSnapshots(
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
// getUserFavoritesEdges
// ---------------------------------------------------------------------------

describe('getUserFavoritesEdges', () => {
  const snapshotIds: Array<AssetPreviewSnapshotId> = []

  // asset_preview_snapshots are not user-owned so they don't cascade when the test
  // user is deleted so clean them up explicitly.
  afterEach(async () => {
    await cleanupAssetPreviewSnapshots(snapshotIds)
    snapshotIds.length = 0
  })

  it('returns empty edges when the user has no favorites', async ({
    client,
  }) => {
    const repo = makeUserFavoritesRepo(client)

    const result = await repo.getUserFavoritesEdges({
      cursor: null,
      pageSize: 10,
    })

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.items).toHaveLength(0)
      expect(result.data.pagination.next).toBeNull()
    }
  })

  it('returns edges with the correct mapped structure', async ({
    client,
    user,
    adminClient,
  }) => {
    const externalId = `INTEG-EDGE-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    await seedFavorite(adminClient, user.id, snapshotId)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges({
      cursor: null,
      pageSize: 10,
    })

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      const { items, pagination } = result.data
      expect(items).toHaveLength(1)
      expect(items[0].assetPreviewSnapshotId).toBe(snapshotId)
      expect(items[0].assetKey).toEqual({ providerId: 'nasa_ivl', externalId })
      expect(typeof items[0].createdAt).toBe('string')
      expect(pagination.next).toBeNull()
    }
  })

  it('returns edges in descending created_at order', async ({
    client,
    user,
    adminClient,
  }) => {
    const id1 = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-ORDER-A-${Date.now()}`,
    )
    // Small delay so the DB timestamps differ
    await new Promise((r) => setTimeout(r, 10))
    const id2 = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-ORDER-B-${Date.now()}`,
    )
    snapshotIds.push(id1, id2)
    await seedFavorite(adminClient, user.id, id1)
    await seedFavorite(adminClient, user.id, id2)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges({
      cursor: null,
      pageSize: 10,
    })

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      const { items } = result.data
      expect(items).toHaveLength(2)
      // most recently created favorite first
      expect(items[0].assetPreviewSnapshotId).toBe(id2)
      expect(items[1].assetPreviewSnapshotId).toBe(id1)
    }
  })

  it('paginates: first page has hasNext, second page does not', async ({
    client,
    user,
    adminClient,
  }) => {
    const id1 = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-PAGE-A-${Date.now()}`,
    )
    await new Promise((r) => setTimeout(r, 10))
    const id2 = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-PAGE-B-${Date.now()}`,
    )
    snapshotIds.push(id1, id2)
    await seedFavorite(adminClient, user.id, id1)
    await seedFavorite(adminClient, user.id, id2)

    const repo = makeUserFavoritesRepo(client)

    const page1 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({ cursor: null, pageSize: 1 }),
    )
    expect(page1.items).toHaveLength(1)
    expect(page1.pagination.next).toEqual(expect.any(String))

    const page2 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({
        cursor: page1.pagination.next,
        pageSize: 1,
      }),
    )
    expect(page2.items).toHaveLength(1)
    expect(page2.pagination.next).toBeNull()
    expect(page2.items[0].assetPreviewSnapshotId).not.toBe(
      page1.items[0].assetPreviewSnapshotId,
    )
  })

  // tie every favorite on created_at so only the snapshot-id key orders
  // them; paging in twos must yield each favorite once, in id order, with
  // no drift (a dropped tiebreaker would duplicate or skip across pages)
  it('breaks created_at ties by snapshot id so pages do not drift', async ({
    client,
    user,
    adminClient,
  }) => {
    const stamp = `${Date.now()}`
    const ids: Array<AssetPreviewSnapshotId> = []
    for (let i = 0; i < 3; i++) {
      ids.push(
        await seedAssetPreviewSnapshot(adminClient, `INTEG-TIE-${stamp}-${i}`),
      )
    }
    snapshotIds.push(...ids)
    const created = new Date(Date.now() - 86_400_000).toISOString()
    for (const id of ids) {
      await seedFavorite(adminClient, user.id, id, created)
    }

    const repo = makeUserFavoritesRepo(client)
    const page1 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({ cursor: null, pageSize: 2 }),
    )
    const page2 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({
        cursor: page1.pagination.next,
        pageSize: 2,
      }),
    )
    const seen = [...page1.items, ...page2.items].map(
      (edge) => edge.assetPreviewSnapshotId,
    )
    expect(seen).toEqual([...ids].sort().reverse())
    expect(new Set(seen).size).toBe(3)
    expect(page1.pagination.total).toBe(3)
  })

  it('a favorite removed mid-walk does not skip or duplicate later rows', async ({
    client,
    user,
    adminClient,
  }) => {
    const stamp = `${Date.now()}`
    const ids: Array<AssetPreviewSnapshotId> = []
    for (let i = 0; i < 4; i++) {
      ids.push(
        await seedAssetPreviewSnapshot(adminClient, `INTEG-MID-${stamp}-${i}`),
      )
      await new Promise((r) => setTimeout(r, 10))
    }
    snapshotIds.push(...ids)
    for (const id of ids) {
      await seedFavorite(adminClient, user.id, id)
    }

    const repo = makeUserFavoritesRepo(client)
    const page1 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({ cursor: null, pageSize: 2 }),
    )
    // newest first: page 1 serves ids[3], ids[2]
    expect(page1.items.map((edge) => edge.assetPreviewSnapshotId)).toEqual([
      ids[3],
      ids[2],
    ])

    const { error } = await adminClient
      .from('favorites')
      .delete()
      .eq('owner_id', user.id)
      .eq('asset_preview_snapshot_id', ids[3])
    expect(error).toBeNull()

    const page2 = unwrapOrThrow(
      await repo.getUserFavoritesEdges({
        cursor: page1.pagination.next,
        pageSize: 2,
      }),
    )
    // offset paging would have skipped ids[1] here
    expect(page2.items.map((edge) => edge.assetPreviewSnapshotId)).toEqual([
      ids[1],
      ids[0],
    ])
    expect(page2.pagination.next).toBeNull()
  })

  it("only returns the authenticated user's own favorites (RLS)", async ({
    client,
    user,
    adminClient,
  }) => {
    // Create a second user whose favorites should be invisible to `client`
    const { data: otherData, error: otherErr } =
      await adminClient.auth.admin.createUser({
        email: `other-${Date.now()}@example.com`,
        password: 'test-password-123!',
        email_confirm: true,
      })
    if (otherErr) throw new Error(otherErr.message)
    const otherId = otherData.user.id

    const myId = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-RLS-MINE-${Date.now()}`,
    )
    await new Promise((r) => setTimeout(r, 10))
    const othId = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-RLS-OTHER-${Date.now()}`,
    )
    snapshotIds.push(myId, othId)
    await seedFavorite(adminClient, user.id, myId)
    await seedFavorite(adminClient, otherId, othId)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges({
      cursor: null,
      pageSize: 10,
    })

    // Clean up the extra user regardless of test outcome
    await adminClient.auth.admin.deleteUser(otherId)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0].assetPreviewSnapshotId).toBe(myId)
    }
  })
})

// ---------------------------------------------------------------------------
// getUserFavoritesIndex
// ---------------------------------------------------------------------------

describe('getUserFavoritesIndex', () => {
  const snapshotIds: Array<AssetPreviewSnapshotId> = []

  afterEach(async () => {
    await cleanupAssetPreviewSnapshots(snapshotIds)
    snapshotIds.length = 0
  })

  it('returns an empty array when the user has no favorites', async ({
    client,
  }) => {
    const repo = makeUserFavoritesRepo(client)

    const result = await repo.getUserFavoritesIndex()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toHaveLength(0)
    }
  })

  it('returns every favorite as a provider_id/externalId pair', async ({
    client,
    user,
    adminClient,
  }) => {
    const extA = `INTEG-IDX-A-${Date.now()}`
    const extB = `INTEG-IDX-B-${Date.now()}`
    const idA = await seedAssetPreviewSnapshot(adminClient, extA)
    const idB = await seedAssetPreviewSnapshot(adminClient, extB)
    snapshotIds.push(idA, idB)
    await seedFavorite(adminClient, user.id, idA)
    await seedFavorite(adminClient, user.id, idB)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesIndex()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      // Order is descending by created_at; idB was inserted later
      expect(result.data).toEqual([
        { providerId: 'nasa_ivl', externalId: extB },
        { providerId: 'nasa_ivl', externalId: extA },
      ])
    }
  })
})
