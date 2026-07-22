import { afterEach, describe, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { makeCollectionsRepo } from './collections.repo'
import { _internals } from './collections.server'
import { CollectionsErrorCodes } from './collections.const'
import type { Database } from '@/integrations/supabase/database.types'
import type { AssetPreviewSnapshotId } from '@/domain/asset/asset.schema'
import { createAdminClient, it } from '@/test/integration-fixtures'
import { resultIsError, resultIsSuccess, unwrapOrThrow } from '@/lib/result'

const {
  createCollectionForUser,
  renameCollectionForUser,
  setCollectionVisibilityForUser,
  deleteCollectionForUser,
  addCollectionItemForUser,
  removeCollectionItemForUser,
} = _internals

function createAnonClient() {
  return createClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  )
}

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
      thumb_href: 'https://images.example.com/thumb.jpg',
      thumb_width: 200,
      thumb_height: 150,
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedAssetPreviewSnapshot: ${error.message}`)
  return data.id
}

async function cleanupAssetPreviewSnapshots(
  ids: Array<AssetPreviewSnapshotId>,
): Promise<void> {
  if (ids.length === 0) return
  const admin = createAdminClient()
  // items reference snapshots with ON DELETE RESTRICT; remove them first
  await admin
    .from('collection_items')
    .delete()
    .in('asset_preview_snapshot_id', ids)
  const { error } = await admin
    .from('asset_preview_snapshots')
    .delete()
    .in('id', ids)
  if (error) console.error('Failed to clean up asset_preview_snapshots:', error)
}

describe('collections CRUD (owner)', () => {
  it('creates private by default and lists in position order', async ({
    client,
    user,
  }) => {
    const first = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Nebulae',
        visibility: 'private',
      }),
    )
    const second = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Apollo',
        visibility: 'private',
      }),
    )
    expect(first.visibility).toBe('private')

    const repo = makeCollectionsRepo(client)
    const collections = unwrapOrThrow(await repo.getUserCollections(user.id))
    expect(collections.map((c) => c.id)).toEqual([first.id, second.id])
  })

  it('rename keeps the id and updates the name', async ({ client, user }) => {
    const created = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Before',
        visibility: 'private',
      }),
    )

    const renamed = unwrapOrThrow(
      await renameCollectionForUser(client, {
        collectionId: created.id,
        name: 'After',
      }),
    )

    expect(renamed.id).toBe(created.id)
    expect(renamed.name).toBe('After')
  })

  it('toggles visibility', async ({ client, user }) => {
    const created = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Toggling',
        visibility: 'private',
      }),
    )

    const updated = unwrapOrThrow(
      await setCollectionVisibilityForUser(client, {
        collectionId: created.id,
        visibility: 'public',
      }),
    )

    expect(updated.visibility).toBe('public')
  })

  it('deletes own collections and reports not-found for a second delete', async ({
    client,
    user,
  }) => {
    const created = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Doomed',
        visibility: 'private',
      }),
    )

    const deleted = await deleteCollectionForUser(client, {
      collectionId: created.id,
    })
    expect(resultIsSuccess(deleted)).toBe(true)

    const again = await deleteCollectionForUser(client, {
      collectionId: created.id,
    })
    expect(resultIsError(again)).toBe(true)
    if (resultIsError(again)) {
      expect(again.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
    }
  })
})

describe('collections RLS (non-owner and anon)', () => {
  it('hides private collections from anon and shows public ones', async ({
    client,
    user,
  }) => {
    const privateCollection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Private',
        visibility: 'private',
      }),
    )
    const publicCollection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Public',
        visibility: 'public',
      }),
    )

    const anonRepo = makeCollectionsRepo(createAnonClient())
    expect(
      unwrapOrThrow(await anonRepo.getCollection(privateCollection.id)),
    ).toBeNull()
    expect(
      unwrapOrThrow(await anonRepo.getCollection(publicCollection.id))?.id,
    ).toBe(publicCollection.id)

    const publicList = unwrapOrThrow(
      await anonRepo.getPublicCollectionsForOwner(user.id),
    )
    expect(publicList.map((c) => c.id)).toEqual([publicCollection.id])
  })

  it("rejects writes to another user's collection as not-found", async ({
    client,
    user,
    adminClient,
  }) => {
    const victim = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Victim',
        visibility: 'public',
      }),
    )

    // second signed-in user
    const otherEmail = `test-other-${Date.now()}@example.com`
    const {
      data: { user: other },
      error: createError,
    } = await adminClient.auth.admin.createUser({
      email: otherEmail,
      password: 'test-password-123!',
      email_confirm: true,
    })
    if (createError || !other) throw new Error('failed to create other user')
    const otherClient = createAnonClient()
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: 'test-password-123!',
    })

    try {
      const rename = await renameCollectionForUser(otherClient, {
        collectionId: victim.id,
        name: 'Hijacked',
      })
      expect(resultIsError(rename)).toBe(true)
      if (resultIsError(rename)) {
        expect(rename.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
      }

      const del = await deleteCollectionForUser(otherClient, {
        collectionId: victim.id,
      })
      expect(resultIsError(del)).toBe(true)
    } finally {
      await adminClient.auth.admin.deleteUser(other.id)
    }
  })
})

describe('collection items', () => {
  const snapshotIds: Array<AssetPreviewSnapshotId> = []

  afterEach(async () => {
    await cleanupAssetPreviewSnapshots(snapshotIds)
    snapshotIds.length = 0
  })

  it('adds items in position order, idempotently', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Ordered',
        visibility: 'private',
      }),
    )
    const firstExternalId = `INTEG-COLL-A-${Date.now()}`
    const secondExternalId = `INTEG-COLL-B-${Date.now()}`
    const firstSnapshot = await seedAssetPreviewSnapshot(
      adminClient,
      firstExternalId,
    )
    const secondSnapshot = await seedAssetPreviewSnapshot(
      adminClient,
      secondExternalId,
    )
    snapshotIds.push(firstSnapshot, secondSnapshot)

    const firstInput = {
      collectionId: collection.id,
      assetKey: { providerId: 'nasa_ivl', externalId: firstExternalId },
    } as const
    unwrapOrThrow(
      await addCollectionItemForUser(client, firstInput, firstSnapshot),
    )
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: collection.id,
          assetKey: { providerId: 'nasa_ivl', externalId: secondExternalId },
        },
        secondSnapshot,
      ),
    )
    // duplicate add is a no-op success
    unwrapOrThrow(
      await addCollectionItemForUser(client, firstInput, firstSnapshot),
    )

    const repo = makeCollectionsRepo(client)
    const edges = unwrapOrThrow(
      await repo.getCollectionItemEdges(collection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    expect(edges.items.map((edge) => edge.assetPreviewSnapshotId)).toEqual([
      firstSnapshot,
      secondSnapshot,
    ])
    expect(edges.items[0].assetKey).toEqual({
      providerId: 'nasa_ivl',
      externalId: firstExternalId,
    })
    expect(edges.pagination.total).toBe(2)
  })

  it("rejects adding to another user's collection as not-found", async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Mine',
        visibility: 'public',
      }),
    )
    const externalId = `INTEG-COLL-RLS-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)

    const anonClient = createAnonClient()
    const result = await addCollectionItemForUser(
      anonClient,
      {
        collectionId: collection.id,
        assetKey: { providerId: 'nasa_ivl', externalId },
      },
      snapshotId,
    )
    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
    }
  })

  it('removes items and reports removed: false for absent ones', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Removals',
        visibility: 'private',
      }),
    )
    const externalId = `INTEG-COLL-RM-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    const input = {
      collectionId: collection.id,
      assetKey: { providerId: 'nasa_ivl', externalId },
    } as const

    unwrapOrThrow(await addCollectionItemForUser(client, input, snapshotId))

    expect(
      unwrapOrThrow(await removeCollectionItemForUser(client, input)).removed,
    ).toBe(true)
    expect(
      unwrapOrThrow(await removeCollectionItemForUser(client, input)).removed,
    ).toBe(false)
  })

  it('anon can read items of public collections but not private ones', async ({
    client,
    user,
    adminClient,
  }) => {
    const publicCollection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Public items',
        visibility: 'public',
      }),
    )
    const externalId = `INTEG-COLL-PUB-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: publicCollection.id,
          assetKey: { providerId: 'nasa_ivl', externalId },
        },
        snapshotId,
      ),
    )

    const anonRepo = makeCollectionsRepo(createAnonClient())
    const publicEdges = unwrapOrThrow(
      await anonRepo.getCollectionItemEdges(publicCollection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    expect(publicEdges.items).toHaveLength(1)

    unwrapOrThrow(
      await setCollectionVisibilityForUser(client, {
        collectionId: publicCollection.id,
        visibility: 'private',
      }),
    )
    const privateEdges = unwrapOrThrow(
      await anonRepo.getCollectionItemEdges(publicCollection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    expect(privateEdges.items).toHaveLength(0)
  })
})

describe('snapshot lifecycle guards', () => {
  const snapshotIds: Array<AssetPreviewSnapshotId> = []

  afterEach(async () => {
    await cleanupAssetPreviewSnapshots(snapshotIds)
    snapshotIds.length = 0
  })

  it('a referenced snapshot cannot be deleted (ON DELETE RESTRICT)', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Guarded',
        visibility: 'private',
      }),
    )
    const externalId = `INTEG-COLL-FK-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: collection.id,
          assetKey: { providerId: 'nasa_ivl', externalId },
        },
        snapshotId,
      ),
    )

    const { error } = await adminClient
      .from('asset_preview_snapshots')
      .delete()
      .eq('id', snapshotId)
    expect(error?.code).toBe('23503')
  })

  it('the orphan sweep spares fresh orphans and referenced snapshots', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Swept',
        visibility: 'private',
      }),
    )
    const orphanExternalId = `INTEG-SWEEP-ORPHAN-${Date.now()}`
    const referencedExternalId = `INTEG-SWEEP-REF-${Date.now()}`
    const orphanId = await seedAssetPreviewSnapshot(
      adminClient,
      orphanExternalId,
    )
    const referencedId = await seedAssetPreviewSnapshot(
      adminClient,
      referencedExternalId,
    )
    snapshotIds.push(orphanId, referencedId)
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: collection.id,
          assetKey: {
            providerId: 'nasa_ivl',
            externalId: referencedExternalId,
          },
        },
        referencedId,
      ),
    )

    // both rows are inside the 30-day grace window, so nothing is swept;
    // the aged path is not reachable here because moddatetime overwrites
    // updated_at on every UPDATE
    const { data: swept, error } = await adminClient.rpc(
      'delete_orphaned_asset_preview_snapshots',
    )
    expect(error).toBeNull()
    expect(swept).toBe(0)

    const { data: survivors } = await adminClient
      .from('asset_preview_snapshots')
      .select('id')
      .in('id', [orphanId, referencedId])
    expect(survivors).toHaveLength(2)
  })

  it('the sweep is not executable by anon', async () => {
    const { error } = await createAnonClient().rpc(
      'delete_orphaned_asset_preview_snapshots',
    )
    expect(error).not.toBeNull()
  })

  it('the snapshot upsert RPC is not executable by anon', async () => {
    const { error } = await createAnonClient().rpc(
      'ensure_asset_preview_snapshot',
      {
        p_provider_id: 'nasa_ivl',
        p_external_id: 'ANON-SHOULD-NOT-WRITE',
        p_title: 'nope',
        p_thumb_href: 'https://example.com/no.jpg',
        p_thumb_width: 1,
        p_thumb_height: 1,
      },
    )
    expect(error).not.toBeNull()
  })
})
