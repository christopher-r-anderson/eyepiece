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
  assertCollectionOwned,
  resolveSnapshotForReAdd,
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
  // moddatetime fires only on UPDATE, so an explicit updated_at survives the
  // insert and lets tests place a row inside or outside the sweep grace window
  updatedAt?: string,
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
      ...(updatedAt ? { updated_at: updatedAt } : {}),
    })
    .select('id')
    .single()
  if (error) throw new Error(`seedAssetPreviewSnapshot: ${error.message}`)
  return data.id
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

// a second signed-in user distinct from the fixture user, for cross-user
// RLS cases (auth.uid() !== owner_id, not just anon); caller deletes the id
async function createSecondSignedInUser(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ id: string; client: ReturnType<typeof createAnonClient> }> {
  const email = `test-other-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
  const password = 'test-password-123!'
  const {
    data: { user },
    error: createError,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !user) {
    throw new Error(`failed to create second user: ${createError?.message}`)
  }
  const client = createAnonClient()
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    throw new Error(`failed to sign in second user: ${signInError.message}`)
  }
  return { id: user.id, client }
}

async function cleanupAssetPreviewSnapshots(
  ids: Array<AssetPreviewSnapshotId>,
): Promise<void> {
  if (ids.length === 0) return
  const admin = createAdminClient()
  // both favorites and collection_items reference snapshots with ON DELETE
  // RESTRICT, so clear references before deleting the snapshots
  await admin
    .from('collection_items')
    .delete()
    .in('asset_preview_snapshot_id', ids)
  await admin.from('favorites').delete().in('asset_preview_snapshot_id', ids)
  const { error } = await admin
    .from('asset_preview_snapshots')
    .delete()
    .in('id', ids)
  if (error) console.error('Failed to clean up asset_preview_snapshots:', error)
}

describe('collections CRUD (owner)', () => {
  it('lists collections in position order', async ({ client, user }) => {
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

    const repo = makeCollectionsRepo(client)
    const collections = unwrapOrThrow(await repo.getUserCollections(user.id))
    expect(collections.map((c) => c.id)).toEqual([first.id, second.id])
  })

  // force a real position tie (createCollectionForUser only ever appends, so
  // ties come from concurrent appends) and assert the created_at-then-id
  // fallback fixes the order. A's id sorts last but its created_at is oldest,
  // so dropping the created_at key would reorder it; B and C share created_at,
  // so dropping the id key would leave them nondeterministic
  it('breaks tied positions by created_at then id', async ({
    client,
    user,
    adminClient,
  }) => {
    // valid v4-format uuids (version/variant nibbles set) that sort by their
    // last byte: b0 < c0 < fa
    const idA = '00000000-0000-4000-8000-0000000000fa'
    const idB = '00000000-0000-4000-8000-0000000000b0'
    const idC = '00000000-0000-4000-8000-0000000000c0'
    // B and C share created_at exactly, so only the id key can order them
    const tiedCreatedAt = daysAgoIso(1)
    const { error } = await adminClient.from('collections').insert([
      {
        id: idA,
        owner_id: user.id,
        name: 'A',
        position: 1,
        created_at: daysAgoIso(2),
      },
      {
        id: idB,
        owner_id: user.id,
        name: 'B',
        position: 1,
        created_at: tiedCreatedAt,
      },
      {
        id: idC,
        owner_id: user.id,
        name: 'C',
        position: 1,
        created_at: tiedCreatedAt,
      },
    ])
    expect(error).toBeNull()

    const collections = unwrapOrThrow(
      await makeCollectionsRepo(client).getUserCollections(user.id),
    )
    expect(collections.map((c) => c.id)).toEqual([idA, idB, idC])
  })

  // insert omitting visibility so the DB column default is what's tested, not
  // a value the caller passed (the createCollection core always supplies one)
  it('defaults visibility to private at the column level', async ({
    client,
    user,
  }) => {
    const { data, error } = await client
      .from('collections')
      .insert({ owner_id: user.id, name: 'Defaulted', position: 1 })
      .select('visibility')
      .single()
    expect(error).toBeNull()
    expect(data?.visibility).toBe('private')
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
  it('blocks creating a collection under another user (INSERT WITH CHECK)', async ({
    user,
    adminClient,
  }) => {
    const other = await createSecondSignedInUser(adminClient)
    try {
      // owner_id is the fixture user, not the authenticated caller
      const { error } = await other.client.from('collections').insert({
        owner_id: user.id,
        name: 'Hijack',
        position: 1,
      })
      expect(error?.code).toBe('42501')
    } finally {
      await adminClient.auth.admin.deleteUser(other.id)
    }
  })

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

    const other = await createSecondSignedInUser(adminClient)

    try {
      const rename = await renameCollectionForUser(other.client, {
        collectionId: victim.id,
        name: 'Hijacked',
      })
      expect(resultIsError(rename)).toBe(true)
      if (resultIsError(rename)) {
        expect(rename.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
      }

      const del = await deleteCollectionForUser(other.client, {
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

  it('builds public collection cards with count and first-item cover', async ({
    client,
    user,
    adminClient,
  }) => {
    const withItems = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'With items',
        visibility: 'public',
      }),
    )
    const empty = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Empty',
        visibility: 'public',
      }),
    )
    const hidden = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Hidden',
        visibility: 'private',
      }),
    )
    const externalA = `cards-a-${Date.now()}`
    const externalB = `cards-b-${Date.now()}`
    const snapshotA = await seedAssetPreviewSnapshot(adminClient, externalA)
    const snapshotB = await seedAssetPreviewSnapshot(adminClient, externalB)
    snapshotIds.push(snapshotA, snapshotB)
    for (const [collectionId, externalId, snapshotId] of [
      [withItems.id, externalA, snapshotA],
      [withItems.id, externalB, snapshotB],
      [hidden.id, externalA, snapshotA],
    ] as const) {
      unwrapOrThrow(
        await addCollectionItemForUser(
          client,
          {
            collectionId,
            assetKey: { providerId: 'nasa_ivl', externalId },
          },
          snapshotId,
        ),
      )
    }

    const cards = unwrapOrThrow(
      await makeCollectionsRepo(
        createAnonClient(),
      ).getPublicCollectionCardsForOwner(user.id),
    )

    expect(cards.map((card) => card.collection.id)).toEqual([
      withItems.id,
      empty.id,
    ])
    expect(cards[0]?.itemCount).toBe(2)
    expect(cards[0]?.cover?.id).toBe(snapshotA)
    expect(cards[0]?.cover?.image?.width).toBe(200)
    expect(cards[1]?.itemCount).toBe(0)
    expect(cards[1]?.cover).toBeNull()
  })

  it('owner cards include private collections; anon reads stay public-only', async ({
    client,
    user,
  }) => {
    const open = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Open',
        visibility: 'public',
      }),
    )
    const hidden = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Hidden',
        visibility: 'private',
      }),
    )

    const ownCards = unwrapOrThrow(
      await makeCollectionsRepo(client).getCollectionCardsForOwner(user.id),
    )
    expect(
      ownCards.map((card) => [card.collection.id, card.collection.visibility]),
    ).toEqual([
      [open.id, 'public'],
      [hidden.id, 'private'],
    ])

    const anonCards = unwrapOrThrow(
      await makeCollectionsRepo(createAnonClient()).getCollectionCardsForOwner(
        user.id,
      ),
    )
    expect(anonCards.map((card) => card.collection.id)).toEqual([open.id])
  })

  // tie every item on position AND created_at so only the snapshot-id key
  // orders them; paging in twos must yield each item once, in id order, with
  // no drift (a dropped tiebreaker would duplicate or skip across pages)
  it('breaks item position ties by snapshot id so pages do not drift', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Tied items',
        visibility: 'private',
      }),
    )
    const stamp = `${Date.now()}`
    const ids: Array<AssetPreviewSnapshotId> = []
    for (let i = 0; i < 3; i++) {
      ids.push(
        await seedAssetPreviewSnapshot(adminClient, `INTEG-TIE-${stamp}-${i}`),
      )
    }
    snapshotIds.push(...ids)
    const created = daysAgoIso(1)
    const { error } = await adminClient.from('collection_items').insert(
      ids.map((sid) => ({
        collection_id: collection.id,
        asset_preview_snapshot_id: sid,
        position: 1,
        created_at: created,
      })),
    )
    expect(error).toBeNull()

    const repo = makeCollectionsRepo(client)
    const page1 = unwrapOrThrow(
      await repo.getCollectionItemEdges(collection.id, {
        page: 1,
        pageSize: 2,
      }),
    )
    const page2 = unwrapOrThrow(
      await repo.getCollectionItemEdges(collection.id, {
        page: 2,
        pageSize: 2,
      }),
    )
    const seen = [...page1.items, ...page2.items].map(
      (edge) => edge.assetPreviewSnapshotId,
    )
    expect(seen).toEqual([...ids].sort())
    expect(new Set(seen).size).toBe(3)
    expect(page1.pagination.total).toBe(3)
  })

  it('re-adding at an explicit position restores the original order', async ({
    client,
    user,
    adminClient,
  }) => {
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Undo target',
        visibility: 'private',
      }),
    )
    const externalIds = ['a', 'b', 'c'].map(
      (tag) => `INTEG-READD-${tag}-${Date.now()}`,
    )
    const ids: Array<AssetPreviewSnapshotId> = []
    for (const externalId of externalIds) {
      ids.push(await seedAssetPreviewSnapshot(adminClient, externalId))
    }
    snapshotIds.push(...ids)
    for (const [index, externalId] of externalIds.entries()) {
      unwrapOrThrow(
        await addCollectionItemForUser(
          client,
          {
            collectionId: collection.id,
            assetKey: { providerId: 'nasa_ivl', externalId },
          },
          ids[index],
        ),
      )
    }

    const repo = makeCollectionsRepo(client)
    const before = unwrapOrThrow(
      await repo.getCollectionItemEdges(collection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    const middle = before.items[1]
    expect(middle.assetPreviewSnapshotId).toBe(ids[1])

    unwrapOrThrow(
      await removeCollectionItemForUser(client, {
        collectionId: collection.id,
        assetKey: middle.assetKey,
      }),
    )
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: collection.id,
          assetKey: middle.assetKey,
        },
        ids[1],
        middle.position,
        middle.createdAt,
      ),
    )

    const after = unwrapOrThrow(
      await repo.getCollectionItemEdges(collection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    expect(after.items.map((edge) => edge.assetPreviewSnapshotId)).toEqual(ids)
    expect(after.items.map((edge) => edge.position)).toEqual([1, 2, 3])
    // the restore carries the original created_at (the position tiebreaker)
    expect(after.items[1]?.createdAt).toBe(middle.createdAt)
  })

  // the external id is fake, so falling through to the provider-backed
  // ensure would fail: an Ok result proves the stored snapshot was reused
  it('re-add resolves a stale stored snapshot without the provider', async ({
    client,
    adminClient,
  }) => {
    const externalId = `INTEG-READD-LOCAL-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(
      adminClient,
      externalId,
      daysAgoIso(10),
    )
    snapshotIds.push(snapshotId)

    const resolved = unwrapOrThrow(
      await resolveSnapshotForReAdd(client, {
        providerId: 'nasa_ivl',
        externalId,
      }),
    )
    expect(resolved).toBe(snapshotId)
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

    // a signed-in non-owner exercises the insert policy's auth.uid() !=
    // owner_id path; the collection is public so the block is proven
    // independent of read visibility
    const other = await createSecondSignedInUser(adminClient)
    try {
      const result = await addCollectionItemForUser(
        other.client,
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
    } finally {
      await adminClient.auth.admin.deleteUser(other.id)
    }
  })

  it('assertCollectionOwned gates add-item on ownership before the snapshot is ensured', async ({
    client,
    user,
    adminClient,
  }) => {
    const owned = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Owned',
        visibility: 'public',
      }),
    )
    expect(
      resultIsSuccess(await assertCollectionOwned(client, user.id, owned.id)),
    ).toBe(true)

    const missing = await assertCollectionOwned(
      client,
      user.id,
      '00000000-0000-0000-0000-000000000000',
    )
    expect(resultIsError(missing)).toBe(true)
    if (resultIsError(missing)) {
      expect(missing.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
    }

    // a public collection the caller can read but does not own
    const other = await createSecondSignedInUser(adminClient)
    try {
      const notOwned = await assertCollectionOwned(
        other.client,
        other.id,
        owned.id,
      )
      expect(resultIsError(notOwned)).toBe(true)
      if (resultIsError(notOwned)) {
        expect(notOwned.error.code).toBe(CollectionsErrorCodes.NOT_FOUND)
      }
    } finally {
      await adminClient.auth.admin.deleteUser(other.id)
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

  it("blocks a second user from removing another user's item", async ({
    client,
    user,
    adminClient,
  }) => {
    // public so the second user can read it - proves the DELETE policy blocks
    // the removal independent of read visibility
    const collection = unwrapOrThrow(
      await createCollectionForUser(client, user.id, {
        name: 'Guarded items',
        visibility: 'public',
      }),
    )
    const externalId = `INTEG-COLL-DEL-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    const input = {
      collectionId: collection.id,
      assetKey: { providerId: 'nasa_ivl', externalId },
    } as const
    unwrapOrThrow(await addCollectionItemForUser(client, input, snapshotId))

    const other = await createSecondSignedInUser(adminClient)
    try {
      // RLS filters the delete to zero rows, so removed is false and the
      // item survives; a permissive DELETE-policy regression would flip this
      expect(
        unwrapOrThrow(await removeCollectionItemForUser(other.client, input))
          .removed,
      ).toBe(false)
    } finally {
      await adminClient.auth.admin.deleteUser(other.id)
    }

    const ownerEdges = unwrapOrThrow(
      await makeCollectionsRepo(client).getCollectionItemEdges(collection.id, {
        page: 1,
        pageSize: 10,
      }),
    )
    expect(ownerEdges.items).toHaveLength(1)
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

  // the favorites FK guards separately from collection_items: a permissive
  // FK there would silently delete a user's favorite
  it('a favorite-referenced snapshot cannot be deleted (ON DELETE RESTRICT)', async ({
    user,
    adminClient,
  }) => {
    const externalId = `INTEG-FAV-FK-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(adminClient, externalId)
    snapshotIds.push(snapshotId)
    const { error: favError } = await adminClient.from('favorites').insert({
      owner_id: user.id,
      asset_preview_snapshot_id: snapshotId,
    })
    if (favError) throw new Error(`seedFavorite: ${favError.message}`)

    const { error } = await adminClient
      .from('asset_preview_snapshots')
      .delete()
      .eq('id', snapshotId)
    expect(error?.code).toBe('23503')
  })

  // re-ensuring a stale snapshot must refresh updated_at even for identical
  // metadata, so a just-ensured row is never inside the sweep's deletion
  // window before it gets referenced
  it('re-ensuring a stale snapshot with identical metadata refreshes updated_at', async ({
    adminClient,
  }) => {
    const externalId = `INTEG-ENSURE-FRESH-${Date.now()}`
    const snapshotId = await seedAssetPreviewSnapshot(
      adminClient,
      externalId,
      daysAgoIso(31),
    )
    snapshotIds.push(snapshotId)

    // identical to the seed values, so only an unconditional refresh moves
    // updated_at
    const { error } = await adminClient.rpc('ensure_asset_preview_snapshot', {
      p_provider_id: 'nasa_ivl',
      p_external_id: externalId,
      p_title: `Integration test asset ${externalId}`,
      p_image_width: 200,
      p_image_height: 150,
      p_renditions: [
        {
          href: 'https://images.example.com/thumb.jpg',
          width: 200,
          height: 150,
        },
      ],
    })
    expect(error).toBeNull()

    const { data: row } = await adminClient
      .from('asset_preview_snapshots')
      .select('updated_at')
      .eq('id', snapshotId)
      .single()
    const ageMs = Date.now() - new Date(row!.updated_at).getTime()
    expect(ageMs).toBeLessThan(60_000)
  })

  it('the orphan sweep deletes aged orphans and spares fresh or referenced ones', async ({
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
    const stamp = `${Date.now()}`
    const agedOrphanId = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-SWEEP-AGED-${stamp}`,
      daysAgoIso(31),
    )
    const freshOrphanId = await seedAssetPreviewSnapshot(
      adminClient,
      `INTEG-SWEEP-FRESH-${stamp}`,
    )
    // aged AND referenced: proves the reference check, not just age, spares it
    const agedReferencedExternalId = `INTEG-SWEEP-REF-${stamp}`
    const agedReferencedId = await seedAssetPreviewSnapshot(
      adminClient,
      agedReferencedExternalId,
      daysAgoIso(31),
    )
    snapshotIds.push(agedOrphanId, freshOrphanId, agedReferencedId)
    unwrapOrThrow(
      await addCollectionItemForUser(
        client,
        {
          collectionId: collection.id,
          assetKey: {
            providerId: 'nasa_ivl',
            externalId: agedReferencedExternalId,
          },
        },
        agedReferencedId,
      ),
    )

    const { data: swept, error } = await adminClient.rpc(
      'delete_orphaned_asset_preview_snapshots',
    )
    expect(error).toBeNull()
    // global sweep, so other aged orphans may raise the count; assert it
    // moved and check the specific rows below
    expect(swept).toBeGreaterThanOrEqual(1)

    const { data: survivors } = await adminClient
      .from('asset_preview_snapshots')
      .select('id')
      .in('id', [agedOrphanId, freshOrphanId, agedReferencedId])
    const survivorIds = (survivors ?? []).map((row) => row.id)
    expect(survivorIds).not.toContain(agedOrphanId)
    expect(survivorIds).toContain(freshOrphanId)
    expect(survivorIds).toContain(agedReferencedId)
  })

  // the migration revokes both anon and authenticated, so cover both roles;
  // `client` is the signed-in fixture user
  it('the sweep is not executable by anon or authenticated', async ({
    client,
  }) => {
    for (const rpcClient of [createAnonClient(), client]) {
      const { error } = await rpcClient.rpc(
        'delete_orphaned_asset_preview_snapshots',
      )
      expect(error).not.toBeNull()
    }
  })

  it('the snapshot upsert RPC is not executable by anon or authenticated', async ({
    client,
  }) => {
    for (const rpcClient of [createAnonClient(), client]) {
      const { error } = await rpcClient.rpc('ensure_asset_preview_snapshot', {
        p_provider_id: 'nasa_ivl',
        p_external_id: 'NON-SERVICE-SHOULD-NOT-WRITE',
        p_title: 'nope',
        p_image_width: 1,
        p_image_height: 1,
        p_renditions: [
          { href: 'https://example.com/no.jpg', width: 1, height: 1 },
        ],
      })
      expect(error).not.toBeNull()
    }
  })

  it('stores a snapshot with no image rather than inventing one', async ({
    adminClient,
  }) => {
    const externalId = `INTEG-NO-IMAGE-${Date.now()}`
    const { error } = await adminClient.rpc('ensure_asset_preview_snapshot', {
      p_provider_id: 'nasa_ivl',
      p_external_id: externalId,
      p_title: 'Nothing renderable',
    })
    expect(error).toBeNull()

    const { data: row } = await adminClient
      .from('asset_preview_snapshots')
      .select('image_width, image_height, renditions')
      .eq('external_id', externalId)
      .single()
    expect(row).toEqual({
      image_width: null,
      image_height: null,
      renditions: null,
    })
  })

  it('rejects an image that is only half stored', async ({ adminClient }) => {
    const { error } = await adminClient.rpc('ensure_asset_preview_snapshot', {
      p_provider_id: 'nasa_ivl',
      p_external_id: `INTEG-HALF-IMAGE-${Date.now()}`,
      p_title: 'A size with no file to put in it',
      p_image_width: 800,
      p_image_height: 600,
    })
    expect(error).not.toBeNull()
  })

  it('a malformed rendition is rejected without disturbing the stored row', async ({
    adminClient,
  }) => {
    const externalId = `INTEG-LADDER-${Date.now()}`
    const good = [
      { href: 'https://example.com/a.jpg', width: 800, height: 600 },
      { href: 'https://example.com/b.jpg', width: 400, height: 300 },
    ]
    const { error: seedError } = await adminClient.rpc(
      'ensure_asset_preview_snapshot',
      {
        p_provider_id: 'nasa_ivl',
        p_external_id: externalId,
        p_title: 'Keeps its ladder',
        p_image_width: 800,
        p_image_height: 600,
        p_renditions: good,
      },
    )
    expect(seedError).toBeNull()

    // shapes the app's schema rejects; the constraint must agree, since a
    // stored one fails the whole batch read
    const malformed = [
      [{ href: 'https://example.com/c.jpg', width: 0, height: 5 }],
      [{ href: null, width: 1, height: 1 }],
      [{ href: 123, width: 1.5, height: 2 }],
      [{ href: 'not-a-url', width: 800, height: 600 }],
      [{ href: '   ', width: 800, height: 600 }],
      [{ href: 'https://', width: 800, height: 600 }],
      // a raw space would also make the whole srcset unparseable
      [{ href: 'https://a/b c.jpg', width: 800, height: 600 }],
      [{ href: 'https://example.com/c.jpg', width: '800', height: 600 }],
      [{ href: 'https://example.com/c.jpg', width: 800 }],
      ['not-an-object'],
    ]
    for (const renditions of malformed) {
      const { error: rejected } = await adminClient.rpc(
        'ensure_asset_preview_snapshot',
        {
          p_provider_id: 'nasa_ivl',
          p_external_id: externalId,
          p_title: 'Should not land',
          p_image_width: 999,
          p_image_height: 999,
          p_renditions: renditions,
        },
      )
      expect(rejected, JSON.stringify(renditions)).not.toBeNull()
    }

    // a partial image against this fully-populated row would slip past the
    // all-or-nothing row CHECK by coalescing with the stored fields, so the
    // function rejects it up front
    const { error: partial } = await adminClient.rpc(
      'ensure_asset_preview_snapshot',
      {
        p_provider_id: 'nasa_ivl',
        p_external_id: externalId,
        p_title: 'Should not land either',
        p_image_width: 999,
      },
    )
    expect(partial).not.toBeNull()

    // the upsert is one statement, so a rejected write costs the caller its
    // update and nothing else: the row keeps the ladder it already had
    const { data: row } = await adminClient
      .from('asset_preview_snapshots')
      .select('title, image_width, renditions')
      .eq('external_id', externalId)
      .single()
    expect(row).toMatchObject({
      title: 'Keeps its ladder',
      image_width: 800,
      renditions: good,
    })
  })
})
