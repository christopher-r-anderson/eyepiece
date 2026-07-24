import { test as setup } from '@playwright/test'
import {
  COLLECTIONS_FIXTURE,
  makeAdminClient,
  thumbHref,
} from './support/collections-fixture'

// Seeds the collection detail fixture: showcase provisioning never runs in
// CI (it would hit the live NASA API), so the spec brings its own rows.
// Delete-then-upsert keeps reruns idempotent; rows stay behind in the local
// database between runs, which a `supabase db reset` clears.
setup('seed collections fixture', async () => {
  const admin = makeAdminClient()
  const { user, snapshots, publicCollection, privateCollection } =
    COLLECTIONS_FIXTURE

  // deleting the user cascades collections and their items, freeing the
  // RESTRICT-protected snapshots for their own delete
  await admin.auth.admin.deleteUser(user.id).catch(() => {})
  const { error: snapshotDeleteError } = await admin
    .from('asset_preview_snapshots')
    .delete()
    .in(
      'id',
      snapshots.map((snapshot) => snapshot.id),
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
      snapshots.map((snapshot) => ({
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
  ])
  if (collectionsError) {
    throw new Error(
      `Failed to upsert fixture collections: ${collectionsError.message}`,
    )
  }

  const { error: itemsError } = await admin.from('collection_items').upsert(
    snapshots.map((snapshot, index) => ({
      collection_id: publicCollection.id,
      asset_preview_snapshot_id: snapshot.id,
      position: index + 1,
    })),
  )
  if (itemsError) {
    throw new Error(`Failed to upsert fixture items: ${itemsError.message}`)
  }
})
