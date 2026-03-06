import { afterEach, describe, expect } from 'vitest'
import { makeUserFavoritesRepo } from './favorites.repo'
import type { AssetSummaryId } from '@/domain/asset/asset.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'
import { resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedAssetSummary(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string,
): Promise<AssetSummaryId> {
  const { data, error } = await admin
    .from('asset_summaries')
    .insert({
      provider: 'nasa_ivl',
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

async function seedFavorite(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  assetSummaryId: AssetSummaryId,
): Promise<void> {
  const { error } = await admin
    .from('favorites')
    .insert({ owner_id: ownerId, asset_summary_id: assetSummaryId })
  if (error) throw new Error(`seedFavorite: ${error.message}`)
}

async function cleanupAssetSummaries(
  ids: Array<AssetSummaryId>,
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await createAdminClient()
    .from('asset_summaries')
    .delete()
    .in('id', ids)
  if (error) console.error('Failed to clean up asset_summaries:', error)
}

// ---------------------------------------------------------------------------
// getUserFavoritesEdges
// ---------------------------------------------------------------------------

describe('getUserFavoritesEdges', () => {
  const summaryIds: Array<AssetSummaryId> = []

  // asset_summaries are not user-owned so they don't cascade when the test
  // user is deleted — clean them up explicitly.
  afterEach(async () => {
    await cleanupAssetSummaries(summaryIds)
    summaryIds.length = 0
  })

  it('returns empty edges when the user has no favorites', async ({
    client,
  }) => {
    const repo = makeUserFavoritesRepo(client)

    const result = await repo.getUserFavoritesEdges()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.edges).toHaveLength(0)
      expect(result.data.pagination.next).toBeNull()
    }
  })

  it('returns edges with the correct mapped structure', async ({
    client,
    user,
    adminClient,
  }) => {
    const externalId = `INTEG-EDGE-${Date.now()}`
    const summaryId = await seedAssetSummary(adminClient, externalId)
    summaryIds.push(summaryId)
    await seedFavorite(adminClient, user.id, summaryId)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      const { edges, pagination } = result.data
      expect(edges).toHaveLength(1)
      expect(edges[0].assetSummaryId).toBe(summaryId)
      expect(edges[0].assetKey).toEqual({ provider: 'nasa_ivl', externalId })
      expect(typeof edges[0].createdAt).toBe('string')
      expect(pagination.next).toBeNull()
    }
  })

  it('returns edges in descending created_at order', async ({
    client,
    user,
    adminClient,
  }) => {
    const id1 = await seedAssetSummary(
      adminClient,
      `INTEG-ORDER-A-${Date.now()}`,
    )
    // Small delay so the DB timestamps differ
    await new Promise((r) => setTimeout(r, 10))
    const id2 = await seedAssetSummary(
      adminClient,
      `INTEG-ORDER-B-${Date.now()}`,
    )
    summaryIds.push(id1, id2)
    await seedFavorite(adminClient, user.id, id1)
    await seedFavorite(adminClient, user.id, id2)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      const { edges } = result.data
      expect(edges).toHaveLength(2)
      // most recently created favorite first
      expect(edges[0].assetSummaryId).toBe(id2)
      expect(edges[1].assetSummaryId).toBe(id1)
    }
  })

  it('paginates: first page has hasNext, second page does not', async ({
    client,
    user,
    adminClient,
  }) => {
    const id1 = await seedAssetSummary(
      adminClient,
      `INTEG-PAGE-A-${Date.now()}`,
    )
    await new Promise((r) => setTimeout(r, 10))
    const id2 = await seedAssetSummary(
      adminClient,
      `INTEG-PAGE-B-${Date.now()}`,
    )
    summaryIds.push(id1, id2)
    await seedFavorite(adminClient, user.id, id1)
    await seedFavorite(adminClient, user.id, id2)

    const repo = makeUserFavoritesRepo(client)

    const page1 = await repo.getUserFavoritesEdges({ page: 1, pageSize: 1 })
    expect(resultIsSuccess(page1)).toBe(true)
    if (resultIsSuccess(page1)) {
      expect(page1.data.edges).toHaveLength(1)
      expect(page1.data.pagination.next).toBe(2)
    }

    const page2 = await repo.getUserFavoritesEdges({ page: 2, pageSize: 1 })
    expect(resultIsSuccess(page2)).toBe(true)
    if (resultIsSuccess(page2)) {
      expect(page2.data.edges).toHaveLength(1)
      expect(page2.data.pagination.next).toBeNull()
    }
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

    const myId = await seedAssetSummary(
      adminClient,
      `INTEG-RLS-MINE-${Date.now()}`,
    )
    await new Promise((r) => setTimeout(r, 10))
    const othId = await seedAssetSummary(
      adminClient,
      `INTEG-RLS-OTHER-${Date.now()}`,
    )
    summaryIds.push(myId, othId)
    await seedFavorite(adminClient, user.id, myId)
    await seedFavorite(adminClient, otherId, othId)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesEdges()

    // Clean up the extra user regardless of test outcome
    await adminClient.auth.admin.deleteUser(otherId)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data.edges).toHaveLength(1)
      expect(result.data.edges[0].assetSummaryId).toBe(myId)
    }
  })
})

// ---------------------------------------------------------------------------
// getUserFavoritesIndex
// ---------------------------------------------------------------------------

describe('getUserFavoritesIndex', () => {
  const summaryIds: Array<AssetSummaryId> = []

  afterEach(async () => {
    await cleanupAssetSummaries(summaryIds)
    summaryIds.length = 0
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

  it('returns every favorite as a provider/externalId pair', async ({
    client,
    user,
    adminClient,
  }) => {
    const extA = `INTEG-IDX-A-${Date.now()}`
    const extB = `INTEG-IDX-B-${Date.now()}`
    const idA = await seedAssetSummary(adminClient, extA)
    const idB = await seedAssetSummary(adminClient, extB)
    summaryIds.push(idA, idB)
    await seedFavorite(adminClient, user.id, idA)
    await seedFavorite(adminClient, user.id, idB)

    const repo = makeUserFavoritesRepo(client)
    const result = await repo.getUserFavoritesIndex()

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      // Order is descending by created_at; idB was inserted later
      expect(result.data).toEqual([
        { provider: 'nasa_ivl', externalId: extB },
        { provider: 'nasa_ivl', externalId: extA },
      ])
    }
  })
})
