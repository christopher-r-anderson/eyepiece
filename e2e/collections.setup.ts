import { randomUUID } from 'node:crypto'
import { test as setup } from '@playwright/test'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
  pagingSnapshot,
  thumbHref,
} from './support/collections-fixture'
import { SHOWCASE_CURATION } from '@/features/collections/collections.showcase'

// Seeds the collection detail fixture: showcase provisioning never runs in
// CI (it would hit the live NASA API), so the spec brings its own rows.
// Delete-then-upsert keeps reruns idempotent; rows stay behind in the local
// database between runs, which a `supabase db reset` clears.
setup('seed collections fixture', async () => {
  const admin = makeAdminClient()
  const { user, snapshots, publicCollection, privateCollection } =
    COLLECTIONS_FIXTURE
  const { pagingCollection } = COLLECTIONS_FIXTURE
  const pagingSnapshots = Array.from(
    { length: pagingCollection.itemCount },
    (_, index) => pagingSnapshot(index),
  )
  const allSnapshots = [...snapshots, ...pagingSnapshots]

  // deleting the user cascades collections and their items, freeing the
  // RESTRICT-protected snapshots for their own delete
  await admin.auth.admin.deleteUser(user.id).catch(() => {})
  const { error: snapshotDeleteError } = await admin
    .from('asset_preview_snapshots')
    .delete()
    .in(
      'id',
      allSnapshots.map((snapshot) => snapshot.id),
    )
  if (snapshotDeleteError) {
    throw new Error(
      `Failed to clear fixture snapshots: ${snapshotDeleteError.message}`,
    )
  }

  const { error: userError } = await admin.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: user.password,
    email_confirm: true,
  })
  if (userError) {
    throw new Error(`Failed to create fixture user: ${userError.message}`)
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: user.id, display_name: user.displayName })
  if (profileError) {
    throw new Error(`Failed to upsert fixture profile: ${profileError.message}`)
  }

  const { error: snapshotsError } = await admin
    .from('asset_preview_snapshots')
    .upsert(
      allSnapshots.map((snapshot) => ({
        id: snapshot.id,
        provider_id: 'nasa_ivl',
        external_id: snapshot.externalId,
        title: snapshot.title,
        thumb_href: thumbHref(snapshot.externalId),
        thumb_width: snapshot.width,
        thumb_height: snapshot.height,
      })),
    )
  if (snapshotsError) {
    throw new Error(
      `Failed to upsert fixture snapshots: ${snapshotsError.message}`,
    )
  }

  const { error: collectionsError } = await admin.from('collections').upsert([
    {
      id: publicCollection.id,
      owner_id: user.id,
      name: publicCollection.name,
      visibility: 'public',
      position: 1,
    },
    {
      id: privateCollection.id,
      owner_id: user.id,
      name: privateCollection.name,
      visibility: 'private',
      position: 2,
    },
    {
      id: pagingCollection.id,
      owner_id: user.id,
      name: pagingCollection.name,
      visibility: 'public',
      position: 3,
    },
  ])
  if (collectionsError) {
    throw new Error(
      `Failed to upsert fixture collections: ${collectionsError.message}`,
    )
  }

  const { error: itemsError } = await admin.from('collection_items').upsert([
    ...snapshots.map((snapshot, index) => ({
      collection_id: publicCollection.id,
      asset_preview_snapshot_id: snapshot.id,
      position: index + 1,
    })),
    ...pagingSnapshots.map((snapshot, index) => ({
      collection_id: pagingCollection.id,
      asset_preview_snapshot_id: snapshot.id,
      position: index + 1,
    })),
  ])
  if (itemsError) {
    throw new Error(`Failed to upsert fixture items: ${itemsError.message}`)
  }
})

// The homepage renders the showcase user's public collections, and CI never
// runs showcase provisioning (it would hit the live NASA API). When the
// showcase is absent or incomplete, reconcile a minimal stand-in on the real
// fixed ids - one stub item per collection - so the cards render everywhere.
// A complete showcase (his real locally-provisioned one, or a finished
// stand-in) is left untouched; every write below is idempotent so a retry
// after a partial seed repairs the remainder. A later real provisioning run
// absorbs the stand-in through its fixed-id upserts.
setup('reconcile showcase stand-in', async () => {
  const admin = makeAdminClient()
  const expectedIds = SHOWCASE_CURATION.collections.map(
    (collection) => collection.id,
  )
  const { data: existing } = await admin
    .from('collections')
    .select('id, collection_items(count)')
    .in('id', expectedIds)
  const complete =
    existing?.length === expectedIds.length &&
    existing.every((row) => (row.collection_items.at(0)?.count ?? 0) > 0)
  if (complete) {
    return
  }

  const { error: userError } = await admin.auth.admin.createUser({
    id: SHOWCASE_CURATION.user.id,
    email: 'showcase-e2e-stand-in@example.com',
    password: randomUUID(),
    email_confirm: true,
  })
  // an existing user is a partial prior seed; everything below repairs it
  if (userError && !/already.*registered/i.test(userError.message)) {
    throw new Error(`Failed to create showcase stand-in: ${userError.message}`)
  }
  const { error: profileError } = await admin.from('profiles').upsert({
    id: SHOWCASE_CURATION.user.id,
    display_name: SHOWCASE_CURATION.user.displayName,
  })
  if (profileError) {
    throw new Error(
      `Failed to upsert showcase stand-in profile: ${profileError.message}`,
    )
  }

  for (const [index, collection] of SHOWCASE_CURATION.collections.entries()) {
    const standInSnapshotId = `e2ec0000-0000-4000-8000-00000000d00${index}`
    const { error: snapshotError } = await admin
      .from('asset_preview_snapshots')
      .upsert({
        id: standInSnapshotId,
        provider_id: 'nasa_ivl',
        external_id: `e2e-showcase-stand-in-${index}`,
        title: `Showcase stand-in ${index}`,
        thumb_href: thumbHref(`e2e-showcase-stand-in-${index}`),
        thumb_width: 630,
        thumb_height: 300,
      })
    if (snapshotError) {
      throw new Error(
        `Failed to seed stand-in snapshot: ${snapshotError.message}`,
      )
    }
    const { error: collectionError } = await admin.from('collections').upsert({
      id: collection.id,
      owner_id: SHOWCASE_CURATION.user.id,
      name: collection.name,
      visibility: 'public',
      position: index + 1,
    })
    if (collectionError) {
      throw new Error(
        `Failed to seed stand-in collection: ${collectionError.message}`,
      )
    }
    const { error: itemError } = await admin.from('collection_items').upsert({
      collection_id: collection.id,
      asset_preview_snapshot_id: standInSnapshotId,
      position: 1,
    })
    if (itemError) {
      throw new Error(`Failed to seed stand-in item: ${itemError.message}`)
    }
  }
})
