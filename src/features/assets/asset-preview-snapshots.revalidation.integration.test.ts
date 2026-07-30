import { afterEach, describe, expect, vi } from 'vitest'
import { revalidateStaleSnapshots } from './asset-preview-snapshots.revalidation'
import type { Asset } from '@/domain/asset/asset.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'

const PREFIX = `REVAL-${Date.now()}`
const STALE_AT = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
const STALE_BEFORE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

// other suites leave stale rows behind, so stubs answer by key and
// assertions read rows, not totals
function makeFetchAsset(assets: Record<string, Asset | null>) {
  return vi.fn((key: { externalId: string }) =>
    Promise.resolve(assets[key.externalId] ?? null),
  )
}

function makeAsset(externalId: string, title: string): Asset {
  return {
    key: { providerId: NASA_IVL_PROVIDER_ID, externalId },
    title,
    image: {
      width: 800,
      height: 600,
      renditions: [
        { href: 'https://example.com/a.jpg', width: 800, height: 600 },
      ],
    },
  }
}

async function seedSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string,
  updatedAt?: string,
) {
  const { data, error } = await admin
    .from('asset_preview_snapshots')
    .insert({
      provider_id: 'nasa_ivl',
      external_id: externalId,
      title: `Seeded ${externalId}`,
      image_width: 200,
      image_height: 150,
      renditions: [
        { href: 'https://example.com/old.jpg', width: 200, height: 150 },
      ],
      // moddatetime fires only on UPDATE, so an explicit updated_at survives
      // the insert and places the row inside or outside the stale window
      ...(updatedAt ? { updated_at: updatedAt } : {}),
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  return data!.id
}

async function seedReferencedSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  externalId: string,
  updatedAt?: string,
) {
  const snapshotId = await seedSnapshot(admin, externalId, updatedAt)
  const { error } = await admin.from('favorites').insert({
    owner_id: ownerId,
    asset_preview_snapshot_id: snapshotId,
  })
  expect(error).toBeNull()
  return snapshotId
}

async function readSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  externalId: string,
) {
  const { data } = await admin
    .from('asset_preview_snapshots')
    .select('title, image_width, renditions, updated_at')
    .eq('external_id', externalId)
    .single()
  return data
}

describe('revalidateStaleSnapshots', () => {
  afterEach(async () => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('asset_preview_snapshots')
      .select('id')
      .like('external_id', `${PREFIX}%`)
    const ids = (data ?? []).map((row) => row.id)
    if (ids.length === 0) return
    // favorites RESTRICT the snapshot delete, so they go first
    await admin.from('favorites').delete().in('asset_preview_snapshot_id', ids)
    await admin.from('asset_preview_snapshots').delete().in('id', ids)
  })

  it('refreshes a stale row and leaves a fresh one alone', async ({
    adminClient,
    user,
  }) => {
    const staleId = `${PREFIX}-stale`
    const freshId = `${PREFIX}-fresh`
    await seedReferencedSnapshot(adminClient, user.id, staleId, STALE_AT)
    await seedReferencedSnapshot(adminClient, user.id, freshId)
    const fetchAsset = makeFetchAsset({
      [staleId]: makeAsset(staleId, 'Refreshed title'),
    })

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset,
      staleBefore: STALE_BEFORE,
      spacingMs: 0,
    })

    expect(fetchAsset).toHaveBeenCalledWith({
      providerId: 'nasa_ivl',
      externalId: staleId,
    })
    expect(fetchAsset).not.toHaveBeenCalledWith(
      expect.objectContaining({ externalId: freshId }),
    )
    expect(result.refreshed).toBeGreaterThanOrEqual(1)
    await expect(readSnapshot(adminClient, staleId)).resolves.toMatchObject({
      title: 'Refreshed title',
      image_width: 800,
    })
    await expect(readSnapshot(adminClient, freshId)).resolves.toMatchObject({
      title: `Seeded ${freshId}`,
    })
  })

  it('skips an orphan so the sweep still sees it age', async ({
    adminClient,
  }) => {
    const orphanId = `${PREFIX}-orphan`
    await seedSnapshot(adminClient, orphanId, STALE_AT)
    const fetchAsset = makeFetchAsset({
      [orphanId]: makeAsset(orphanId, 'Should never land'),
    })

    await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset,
      staleBefore: STALE_BEFORE,
      spacingMs: 0,
    })

    expect(fetchAsset).not.toHaveBeenCalledWith(
      expect.objectContaining({ externalId: orphanId }),
    )
    await expect(readSnapshot(adminClient, orphanId)).resolves.toMatchObject({
      title: `Seeded ${orphanId}`,
    })
  })

  it('pages past rows it leaves stale instead of starving the rest', async ({
    adminClient,
    user,
  }) => {
    const goneId = `${PREFIX}-page-gone`
    const laterA = `${PREFIX}-page-a`
    const laterB = `${PREFIX}-page-b`
    await seedReferencedSnapshot(adminClient, user.id, goneId, STALE_AT)
    await seedReferencedSnapshot(
      adminClient,
      user.id,
      laterA,
      new Date(Date.parse(STALE_AT) + 60_000).toISOString(),
    )
    await seedReferencedSnapshot(
      adminClient,
      user.id,
      laterB,
      new Date(Date.parse(STALE_AT) + 120_000).toISOString(),
    )
    const fetchAsset = makeFetchAsset({
      [laterA]: makeAsset(laterA, 'Refreshed A'),
      [laterB]: makeAsset(laterB, 'Refreshed B'),
    })

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset,
      staleBefore: STALE_BEFORE,
      spacingMs: 0,
      pageSize: 1,
    })

    expect(result.missing).toBeGreaterThanOrEqual(1)
    await expect(readSnapshot(adminClient, laterA)).resolves.toMatchObject({
      title: 'Refreshed A',
    })
    await expect(readSnapshot(adminClient, laterB)).resolves.toMatchObject({
      title: 'Refreshed B',
    })
    await expect(readSnapshot(adminClient, goneId)).resolves.toMatchObject({
      title: `Seeded ${goneId}`,
    })
  })

  it('reports a failed fetch and keeps the row for the next run', async ({
    adminClient,
    user,
  }) => {
    const failId = `${PREFIX}-fail`
    await seedReferencedSnapshot(adminClient, user.id, failId, STALE_AT)

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset: vi.fn((key: { externalId: string }) =>
        key.externalId === failId
          ? Promise.reject(new Error('provider down'))
          : Promise.resolve(null),
      ),
      staleBefore: STALE_BEFORE,
      spacingMs: 0,
    })

    expect(
      result.failures.filter((line) => line.includes(failId)),
    ).toHaveLength(1)
    await expect(readSnapshot(adminClient, failId)).resolves.toMatchObject({
      title: `Seeded ${failId}`,
    })
  })

  it('refreshes the title but keeps the stored image when the asset has none', async ({
    adminClient,
    user,
  }) => {
    const imagelessId = `${PREFIX}-imageless`
    await seedReferencedSnapshot(adminClient, user.id, imagelessId, STALE_AT)

    await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset: makeFetchAsset({
        [imagelessId]: {
          key: { providerId: NASA_IVL_PROVIDER_ID, externalId: imagelessId },
          title: 'Title only now',
        },
      }),
      staleBefore: STALE_BEFORE,
      spacingMs: 0,
    })

    // the ensure RPC keeps stored fields when the caller omits them; the
    // trade-off and its revisit trigger are in docs/Providers.md
    await expect(readSnapshot(adminClient, imagelessId)).resolves.toMatchObject(
      {
        title: 'Title only now',
        image_width: 200,
      },
    )
  })
})
