import { afterEach, describe, expect, vi } from 'vitest'
import { revalidateStaleSnapshots } from './asset-preview-snapshots.revalidation'
import type { Asset } from '@/domain/asset/asset.schema'
import { NASA_IVL_PROVIDER_ID } from '@/domain/provider/provider.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'

const PREFIX = `REVAL-${Date.now()}`
const STALE_AT = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

// other suites and earlier runs leave their own stale rows behind, so
// fetchAsset stubs answer by key and assertions read rows, not totals
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
  const { error } = await admin.from('asset_preview_snapshots').insert({
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
  expect(error).toBeNull()
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
    await createAdminClient()
      .from('asset_preview_snapshots')
      .delete()
      .like('external_id', `${PREFIX}%`)
  })

  it('refreshes a stale row and leaves a fresh one alone', async ({
    adminClient,
  }) => {
    const staleId = `${PREFIX}-stale`
    const freshId = `${PREFIX}-fresh`
    await seedSnapshot(adminClient, staleId, STALE_AT)
    await seedSnapshot(adminClient, freshId)
    const fetchAsset = makeFetchAsset({
      [staleId]: makeAsset(staleId, 'Refreshed title'),
    })

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset,
      staleBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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

  it('leaves a gone-upstream row untouched and stale', async ({
    adminClient,
  }) => {
    const goneId = `${PREFIX}-gone`
    await seedSnapshot(adminClient, goneId, STALE_AT)

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset: makeFetchAsset({ [goneId]: null }),
      staleBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      spacingMs: 0,
    })

    expect(result.missing).toBeGreaterThanOrEqual(1)
    // untouched includes updated_at, so the next run asks about it again
    await expect(readSnapshot(adminClient, goneId)).resolves.toMatchObject({
      title: `Seeded ${goneId}`,
      updated_at: expect.stringContaining(STALE_AT.slice(0, 19)),
    })
  })

  it('reports a failed fetch and keeps the row for the next run', async ({
    adminClient,
  }) => {
    const failId = `${PREFIX}-fail`
    await seedSnapshot(adminClient, failId, STALE_AT)

    const result = await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset: vi.fn((key: { externalId: string }) =>
        key.externalId === failId
          ? Promise.reject(new Error('provider down'))
          : Promise.resolve(null),
      ),
      staleBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
  }) => {
    const imagelessId = `${PREFIX}-imageless`
    await seedSnapshot(adminClient, imagelessId, STALE_AT)

    await revalidateStaleSnapshots({
      client: adminClient,
      fetchAsset: makeFetchAsset({
        [imagelessId]: {
          key: { providerId: NASA_IVL_PROVIDER_ID, externalId: imagelessId },
          title: 'Title only now',
        },
      }),
      staleBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      spacingMs: 0,
    })

    // the ensure RPC keeps stored fields when the caller omits them; whether
    // a refresh may ever clear an image is #205's open distinction
    await expect(readSnapshot(adminClient, imagelessId)).resolves.toMatchObject(
      {
        title: 'Title only now',
        image_width: 200,
      },
    )
  })
})
