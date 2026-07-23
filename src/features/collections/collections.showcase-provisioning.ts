import { z } from 'zod'
import { collectionIdSchema, collectionNameSchema } from './collections.schema'
import type {
  ShowcaseCollection,
  ShowcaseCuration,
} from './collections.showcase'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { ASSET_PREVIEW_SNAPSHOT_STALE_TIME } from '@/features/assets/asset-preview-snapshots.const'

// Declarative reconcile run by scripts/provision-showcase.ts with service-role
// credentials (locally after a db reset, and by CI against production on
// deploy). It sits outside the app's server surface, so failures throw plain
// errors for the script to report instead of going through Result plumbing.

export interface ShowcaseAssetPreview {
  title: string
  thumbnail: {
    href: string
    width: number
    height: number
  }
}

export type FetchShowcaseAsset = (
  assetKey: AssetKey,
) => Promise<ShowcaseAssetPreview | null>

export interface ProvisionShowcaseSummary {
  userCreated: boolean
  snapshotsFetched: number
  collectionsWritten: number
  collectionsDeleted: number
  itemsWritten: number
  itemsRemoved: number
}

function assetKeyId(assetKey: AssetKey): string {
  return `${assetKey.providerId}:${assetKey.externalId}`
}

export function validateShowcaseCuration(curation: ShowcaseCuration): void {
  z.uuid().parse(curation.user.id)
  z.email().parse(curation.user.email)
  z.string().trim().min(1).parse(curation.user.displayName)

  const collectionIds = new Set<string>()
  for (const collection of curation.collections) {
    collectionIdSchema.parse(collection.id)
    if (collectionIds.has(collection.id)) {
      throw new Error(`duplicate showcase collection id: ${collection.id}`)
    }
    collectionIds.add(collection.id)
    collectionNameSchema.parse(collection.name)

    if (collection.items.length === 0) {
      throw new Error(`showcase collection has no items: ${collection.name}`)
    }
    const itemIds = new Set<string>()
    for (const item of collection.items) {
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
): Promise<{ userCreated: boolean }> {
  const { data, error } = await adminClient.auth.admin.getUserById(user.id)
  if (error && error.status !== 404) {
    throw new Error(`showcase user lookup failed: ${error.message}`)
  }
  if (data.user) {
    return { userCreated: false }
  }

  // no standing credentials by design: the password is random and discarded,
  // so access is only ever minted on demand with project-admin rights.
  // one uuid, not more - gotrue rejects passwords past bcrypt's 72-byte limit
  const { error: createError } = await adminClient.auth.admin.createUser({
    id: user.id,
    email: user.email,
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
        p_thumb_href: asset.thumbnail.href,
        p_thumb_width: asset.thumbnail.width,
        p_thumb_height: asset.thumbnail.height,
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

async function reconcileCollections(
  adminClient: SupabaseClient,
  curation: ShowcaseCuration,
): Promise<{ collectionsWritten: number; collectionsDeleted: number }> {
  const rows = curation.collections.map((collection, index) => ({
    id: collection.id,
    owner_id: curation.user.id,
    name: collection.name,
    visibility: collection.visibility,
    position: index + 1,
  }))
  const { error } = await adminClient
    .from('collections')
    .upsert(rows, { onConflict: 'id' })
  if (error) {
    throw new Error(`collections upsert failed: ${error.message}`)
  }

  const { count, error: deleteError } = await adminClient
    .from('collections')
    .delete({ count: 'exact' })
    .eq('owner_id', curation.user.id)
    .not('id', 'in', `(${rows.map((row) => row.id).join(',')})`)
  if (deleteError) {
    throw new Error(`collections prune failed: ${deleteError.message}`)
  }
  return { collectionsWritten: rows.length, collectionsDeleted: count ?? 0 }
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

export async function provisionShowcaseContent(
  adminClient: SupabaseClient,
  fetchAsset: FetchShowcaseAsset,
  curation: ShowcaseCuration,
): Promise<ProvisionShowcaseSummary> {
  validateShowcaseCuration(curation)

  const { userCreated } = await ensureShowcaseUser(adminClient, curation.user)

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

  const { collectionsWritten, collectionsDeleted } = await reconcileCollections(
    adminClient,
    curation,
  )

  let itemsWritten = 0
  let itemsRemoved = 0
  for (const collection of curation.collections) {
    const result = await reconcileItems(adminClient, collection, snapshotIds)
    itemsWritten += result.itemsWritten
    itemsRemoved += result.itemsRemoved
  }

  return {
    userCreated,
    snapshotsFetched,
    collectionsWritten,
    collectionsDeleted,
    itemsWritten,
    itemsRemoved,
  }
}
