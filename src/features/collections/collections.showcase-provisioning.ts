import { z } from 'zod'
import { collectionIdSchema, collectionNameSchema } from './collections.schema'
import type {
  ShowcaseCollection,
  ShowcaseCuration,
} from './collections.showcase'
import type { AssetImage, AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { assetKeySchema } from '@/domain/asset/asset.schema'
import { profileSchema } from '@/domain/profile/profile.schema'
import { ASSET_PREVIEW_SNAPSHOT_STALE_TIME } from '@/features/assets/asset-preview-snapshots.const'

// Declarative reconcile run by scripts/provision-showcase.ts with service-role
// credentials (locally after a db reset, and by CI against production on
// deploy). It sits outside the app's server surface, so failures throw plain
// errors for the script to report instead of going through Result plumbing.

interface ShowcaseAssetPreview {
  title: string
  image?: AssetImage
}

export type FetchShowcaseAsset = (
  assetKey: AssetKey,
) => Promise<ShowcaseAssetPreview | null>

export interface ProvisionShowcaseSummary {
  userCreated: boolean
  snapshotsFetched: number
  collectionsWritten: number
  collectionsHidden: number
  collectionsDeleted: number
  itemsWritten: number
  itemsRemoved: number
}

function assetKeyId(assetKey: AssetKey): string {
  return `${assetKey.providerId}:${assetKey.externalId}`
}

// the name schemas trim before checking bounds, but the reconcile persists
// the curation values verbatim, so padded input must be rejected outright or
// a name passing validation could still violate the untrimmed DB checks
function assertTrimmed(value: string, label: string): void {
  if (value !== value.trim()) {
    throw new Error(`${label} has surrounding whitespace: "${value}"`)
  }
}

export function validateShowcaseCuration(curation: ShowcaseCuration): void {
  z.uuid().parse(curation.user.id)
  assertTrimmed(curation.user.displayName, 'showcase display name')
  profileSchema.shape.displayName.parse(curation.user.displayName)

  const collectionIds = new Set<string>()
  for (const collection of curation.collections) {
    collectionIdSchema.parse(collection.id)
    if (collectionIds.has(collection.id)) {
      throw new Error(`duplicate showcase collection id: ${collection.id}`)
    }
    collectionIds.add(collection.id)
    assertTrimmed(collection.name, 'showcase collection name')
    collectionNameSchema.parse(collection.name)

    if (collection.items.length === 0) {
      throw new Error(`showcase collection has no items: ${collection.name}`)
    }
    const itemIds = new Set<string>()
    for (const item of collection.items) {
      assetKeySchema.parse(item)
      const id = assetKeyId(item)
      if (itemIds.has(id)) {
        throw new Error(
          `duplicate item in showcase collection ${collection.name}: ${id}`,
        )
      }
      itemIds.add(id)
    }
  }
}

async function ensureShowcaseUser(
  adminClient: SupabaseClient,
  user: ShowcaseCuration['user'],
  email: string,
): Promise<{ userCreated: boolean }> {
  const { data, error } = await adminClient.auth.admin.getUserById(user.id)
  if (error && error.status !== 404) {
    throw new Error(`showcase user lookup failed: ${error.message}`)
  }
  if (data.user) {
    const changes: {
      email?: string
      email_confirm?: boolean
      user_metadata?: { display_name: string }
    } = {}
    if (data.user.email !== email) {
      changes.email = email
      changes.email_confirm = true
    }
    if (data.user.user_metadata.display_name !== user.displayName) {
      changes.user_metadata = { display_name: user.displayName }
    }
    if (Object.keys(changes).length > 0) {
      const { error: updateError } =
        await adminClient.auth.admin.updateUserById(user.id, changes)
      if (updateError) {
        throw new Error(`showcase user update failed: ${updateError.message}`)
      }
    }
    return { userCreated: false }
  }

  // no standing credentials by design: the password is random and discarded,
  // so access is only ever minted on demand with project-admin rights.
  // one uuid, not more - gotrue rejects passwords past bcrypt's 72-byte limit
  const { error: createError } = await adminClient.auth.admin.createUser({
    id: user.id,
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { display_name: user.displayName },
  })
  if (createError) {
    throw new Error(`showcase user creation failed: ${createError.message}`)
  }
  return { userCreated: true }
}

// the reconcile upserts collection rows by fixed id, which would re-own a
// colliding row; refuse instead of silently stealing another user's collection
async function assertCurationIdsNotForeign(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<void> {
  if (curation.collections.length === 0) return
  const { data, error } = await adminClient
    .from('collections')
    .select('id, owner_id')
    .in(
      'id',
      curation.collections.map((collection) => collection.id),
    )
  if (error) {
    throw new Error(
      `showcase collection ownership check failed: ${error.message}`,
    )
  }
  const foreign = data.filter((row) => row.owner_id !== curation.user.id)
  if (foreign.length > 0) {
    throw new Error(
      `refusing to provision: collection ids owned by another user: ${foreign
        .map((row) => row.id)
        .join(', ')}`,
    )
  }
}

async function ensureSnapshots(
  adminClient: SupabaseClient,
  fetchAsset: FetchShowcaseAsset,
  curation: ShowcaseCuration,
): Promise<{ snapshotIds: Map<string, string>; snapshotsFetched: number }> {
  const uniqueKeys = new Map<string, AssetKey>()
  for (const collection of curation.collections) {
    for (const item of collection.items) {
      uniqueKeys.set(assetKeyId(item), item)
    }
  }

  const snapshotIds = new Map<string, string>()
  let snapshotsFetched = 0
  for (const [id, assetKey] of uniqueKeys) {
    const { data: snapshot, error } = await adminClient
      .from('asset_preview_snapshots')
      .select('id, updated_at')
      .eq('provider_id', assetKey.providerId)
      .eq('external_id', assetKey.externalId)
      .maybeSingle()
    if (error) {
      throw new Error(`snapshot lookup failed for ${id}: ${error.message}`)
    }
    if (
      snapshot &&
      Date.now() - new Date(snapshot.updated_at).getTime() <
        ASSET_PREVIEW_SNAPSHOT_STALE_TIME
    ) {
      snapshotIds.set(id, snapshot.id)
      continue
    }

    const asset = await fetchAsset(assetKey)
    if (asset === null) {
      throw new Error(`curated asset not found at provider: ${id}`)
    }
    const { data: ensuredId, error: ensureError } = await adminClient.rpc(
      'ensure_asset_preview_snapshot',
      {
        p_provider_id: assetKey.providerId,
        p_external_id: assetKey.externalId,
        p_title: asset.title,
        ...(asset.image && {
          p_image_width: asset.image.width,
          p_image_height: asset.image.height,
          p_renditions: asset.image.renditions,
        }),
      },
    )
    if (ensureError) {
      throw new Error(
        `snapshot ensure failed for ${id}: ${ensureError.message}`,
      )
    }
    snapshotIds.set(id, ensuredId)
    snapshotsFetched += 1
  }
  return { snapshotIds, snapshotsFetched }
}

async function upsertCollections(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<{ collectionsWritten: number }> {
  const rows = curation.collections.map((collection, index) => ({
    id: collection.id,
    owner_id: curation.user.id,
    name: collection.name,
    visibility: collection.visibility,
    position: index + 1,
  }))
  if (rows.length === 0) {
    return { collectionsWritten: 0 }
  }
  const { error } = await adminClient
    .from('collections')
    .upsert(rows, { onConflict: 'id' })
  if (error) {
    throw new Error(`collections upsert failed: ${error.message}`)
  }
  return { collectionsWritten: rows.length }
}

async function selectRemovedCollectionIds(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<Array<string>> {
  const keepIds = curation.collections.map((collection) => collection.id)
  // an empty keep list means everything is removed; PostgREST rejects `not.in.()`
  let staleQuery = adminClient
    .from('collections')
    .select('id')
    .eq('owner_id', curation.user.id)
  if (keepIds.length > 0) {
    staleQuery = staleQuery.not('id', 'in', `(${keepIds.join(',')})`)
  }
  const { data: stale, error: staleError } = await staleQuery
  if (staleError) {
    throw new Error(`removed collections lookup failed: ${staleError.message}`)
  }
  return stale.map((row) => row.id)
}

async function hideRemovedCollections(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<{ collectionsHidden: number }> {
  const removedIds = await selectRemovedCollectionIds(adminClient, curation)
  if (removedIds.length === 0) {
    return { collectionsHidden: 0 }
  }
  const { count, error } = await adminClient
    .from('collections')
    .update({ visibility: 'private' }, { count: 'exact' })
    .in('id', removedIds)
  if (error) {
    throw new Error(`collections hide failed: ${error.message}`)
  }
  return { collectionsHidden: count ?? 0 }
}

async function pruneRemovedCollections(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<{ collectionsDeleted: number; itemsRemoved: number }> {
  const staleIds = await selectRemovedCollectionIds(adminClient, curation)
  if (staleIds.length === 0) {
    return { collectionsDeleted: 0, itemsRemoved: 0 }
  }
  // counted up front because deleting the collections cascades their items
  const { count: cascadedItems, error: countError } = await adminClient
    .from('collection_items')
    .select('*', { count: 'exact', head: true })
    .in('collection_id', staleIds)
  if (countError) {
    throw new Error(
      `collections prune item count failed: ${countError.message}`,
    )
  }

  const { count, error } = await adminClient
    .from('collections')
    .delete({ count: 'exact' })
    .in('id', staleIds)
  if (error) {
    throw new Error(`collections prune failed: ${error.message}`)
  }
  return { collectionsDeleted: count ?? 0, itemsRemoved: cascadedItems ?? 0 }
}

async function reconcileItems(
  adminClient: SupabaseClient,
  collection: ShowcaseCollection,
  snapshotIds: Map<string, string>,
): Promise<{ itemsWritten: number; itemsRemoved: number }> {
  const rows = collection.items.map((item, index) => {
    const snapshotId = snapshotIds.get(assetKeyId(item))
    if (!snapshotId) {
      throw new Error(`missing snapshot id for ${assetKeyId(item)}`)
    }
    return {
      collection_id: collection.id,
      asset_preview_snapshot_id: snapshotId,
      position: index + 1,
    }
  })
  const { error } = await adminClient
    .from('collection_items')
    .upsert(rows, { onConflict: 'collection_id,asset_preview_snapshot_id' })
  if (error) {
    throw new Error(
      `items upsert failed for ${collection.name}: ${error.message}`,
    )
  }

  const { count, error: deleteError } = await adminClient
    .from('collection_items')
    .delete({ count: 'exact' })
    .eq('collection_id', collection.id)
    .not(
      'asset_preview_snapshot_id',
      'in',
      `(${rows.map((row) => row.asset_preview_snapshot_id).join(',')})`,
    )
  if (deleteError) {
    throw new Error(
      `items prune failed for ${collection.name}: ${deleteError.message}`,
    )
  }
  return { itemsWritten: rows.length, itemsRemoved: count ?? 0 }
}

// The phases exist because a deploy publishes the site separately from
// reconciling the database, and either half can fail: 'apply' runs before the
// publish (a newly published homepage must never link content that does not
// exist yet) and 'prune' runs after a successful publish (a failed publish
// must never leave the still-live homepage linking a deleted collection).
// Deletion cannot simply move into 'apply' because the production build runs
// between the phases and prerenders from the database, so 'apply' hides
// removed collections instead: the build cannot render them, while they stay
// recoverable until the publish succeeds and 'prune' deletes them.
// 'full' does both for single-environment runs like local seeding. A failure
// between the phases leaves at most stale extras (hidden, not visible),
// which the next successful prune removes.
export type ProvisionShowcasePhase = 'full' | 'apply' | 'prune'

export interface ProvisionShowcaseOptions {
  // deployment configuration, not curation content: the mailbox owner can
  // reach the account through the normal password-reset flow
  email: string
  phase?: ProvisionShowcasePhase
}

export async function provisionShowcaseContent(
  adminClient: SupabaseClient,
  fetchAsset: FetchShowcaseAsset,
  curation: ShowcaseCuration,
  options: ProvisionShowcaseOptions,
): Promise<ProvisionShowcaseSummary> {
  const { email, phase = 'full' } = options
  z.email().parse(email)
  validateShowcaseCuration(curation)

  const summary: ProvisionShowcaseSummary = {
    userCreated: false,
    snapshotsFetched: 0,
    collectionsWritten: 0,
    collectionsHidden: 0,
    collectionsDeleted: 0,
    itemsWritten: 0,
    itemsRemoved: 0,
  }

  if (phase !== 'prune') {
    const { userCreated } = await ensureShowcaseUser(
      adminClient,
      curation.user,
      email,
    )
    summary.userCreated = userCreated

    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: curation.user.id,
        display_name: curation.user.displayName,
      },
      { onConflict: 'id' },
    )
    if (profileError) {
      throw new Error(`showcase profile upsert failed: ${profileError.message}`)
    }

    await assertCurationIdsNotForeign(adminClient, curation)

    const { snapshotIds, snapshotsFetched } = await ensureSnapshots(
      adminClient,
      fetchAsset,
      curation,
    )
    summary.snapshotsFetched = snapshotsFetched

    const { collectionsWritten } = await upsertCollections(
      adminClient,
      curation,
    )
    summary.collectionsWritten = collectionsWritten

    for (const collection of curation.collections) {
      const result = await reconcileItems(adminClient, collection, snapshotIds)
      summary.itemsWritten += result.itemsWritten
      summary.itemsRemoved += result.itemsRemoved
    }

    const { collectionsHidden } = await hideRemovedCollections(
      adminClient,
      curation,
    )
    summary.collectionsHidden = collectionsHidden
  }

  if (phase !== 'apply') {
    const pruned = await pruneRemovedCollections(adminClient, curation)
    summary.collectionsDeleted = pruned.collectionsDeleted
    summary.itemsRemoved += pruned.itemsRemoved
  }

  return summary
}
