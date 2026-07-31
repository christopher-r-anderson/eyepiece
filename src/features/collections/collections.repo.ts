import { z } from 'zod'
import { useMemo } from 'react'
import { collectionVisibilitySchema } from './collections.schema'
import type {
  Collection,
  CollectionCard,
  CollectionId,
  CollectionItemEdge,
  CollectionVisibility,
} from './collections.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { Err, Ok } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schema'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'
import { useUserSupabaseClient } from '@/integrations/supabase/user.hooks'
import {
  calculateNextPage,
  pageNumberCursor,
} from '@/domain/pagination/pagination.utils'
import {
  dbAssetPreviewSnapshotSchema,
  mapAssetPreviewSnapshot,
} from '@/features/assets/asset-preview-snapshots.repo'

const dbCollectionSchema = z.object({
  id: z.uuid(),
  owner_id: z.uuid(),
  name: z.string(),
  visibility: collectionVisibilitySchema,
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
})

type DbCollection = z.infer<typeof dbCollectionSchema>

const dbCollectionsSchema = z.array(dbCollectionSchema)

export const COLLECTION_COLUMNS =
  'id, owner_id, name, visibility, created_at, updated_at'

export function mapCollection(row: DbCollection): Collection {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const dbCollectionCardSchema = dbCollectionSchema.extend({
  item_count: z.array(z.object({ count: z.number().int().nonnegative() })),
  cover_items: z.array(
    z.object({ asset_preview_snapshots: dbAssetPreviewSnapshotSchema }),
  ),
})

type DbCollectionCard = z.infer<typeof dbCollectionCardSchema>

const dbCollectionCardsSchema = z.array(dbCollectionCardSchema)

function mapCollectionCard(row: DbCollectionCard): CollectionCard {
  const coverRow = row.cover_items.at(0)?.asset_preview_snapshots
  return {
    collection: mapCollection(row),
    itemCount: row.item_count.at(0)?.count ?? 0,
    cover: coverRow ? mapAssetPreviewSnapshot(coverRow) : null,
  }
}

const dbCollectionItemEdgeSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  position: z.number().int(),
  asset_preview_snapshots: z.object({
    id: z.uuid(),
    provider_id: providerIdSchema,
    external_id: externalAssetIdSchema,
  }),
})

type DbCollectionItemEdge = z.infer<typeof dbCollectionItemEdgeSchema>

const dbCollectionItemEdgesSchema = z.array(dbCollectionItemEdgeSchema)

function mapCollectionItemEdge(row: DbCollectionItemEdge): CollectionItemEdge {
  return {
    createdAt: row.created_at,
    assetPreviewSnapshotId: row.asset_preview_snapshots.id,
    assetKey: {
      providerId: row.asset_preview_snapshots.provider_id,
      externalId: row.asset_preview_snapshots.external_id,
    },
    position: row.position,
  }
}

export type CollectionsRepo = ReturnType<typeof makeCollectionsRepo>

// Reads only; RLS decides visibility per client (user client sees own +
// public, public client sees public). Writes live in collections.server.ts.
export function makeCollectionsRepo(client: SupabaseClient) {
  // the select policy is owner-or-public, so listing "my collections"
  // must filter by owner rather than rely on RLS alone
  async function getUserCollections(
    ownerId: string,
  ): Promise<Result<Array<Collection>>> {
    const { data, error: pgError } = await client
      .from('collections')
      .select(COLLECTION_COLUMNS)
      .eq('owner_id', ownerId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    const { data: rows, error: parseError } =
      dbCollectionsSchema.safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok(rows.map(mapCollection))
  }

  async function getPublicCollectionsForOwner(
    ownerId: string,
  ): Promise<Result<Array<Collection>>> {
    const { data, error: pgError } = await client
      .from('collections')
      .select(COLLECTION_COLUMNS)
      .eq('owner_id', ownerId)
      .eq('visibility', 'public')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    const { data: rows, error: parseError } =
      dbCollectionsSchema.safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok(rows.map(mapCollection))
  }

  async function getCollectionCardsForOwnerWithVisibility(
    ownerId: string,
    visibility: CollectionVisibility | undefined,
  ): Promise<Result<Array<CollectionCard>>> {
    let query = client
      .from('collections')
      .select(
        `${COLLECTION_COLUMNS}, item_count:collection_items(count), cover_items:collection_items(asset_preview_snapshots(id, provider_id, external_id, title, image_width, image_height, renditions))`,
      )
      .eq('owner_id', ownerId)
    if (visibility) {
      query = query.eq('visibility', visibility)
    }
    const { data, error: pgError } = await query
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .order('position', { ascending: true, referencedTable: 'cover_items' })
      .order('created_at', { ascending: true, referencedTable: 'cover_items' })
      .order('asset_preview_snapshot_id', {
        ascending: true,
        referencedTable: 'cover_items',
      })
      .limit(1, { referencedTable: 'cover_items' })
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    const { data: rows, error: parseError } =
      dbCollectionCardsSchema.safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok(rows.map(mapCollectionCard))
  }

  function getPublicCollectionCardsForOwner(ownerId: string) {
    return getCollectionCardsForOwnerWithVisibility(ownerId, 'public')
  }

  // all visibilities: only meaningful on the user client, where RLS reveals
  // the caller's own private rows
  function getCollectionCardsForOwner(ownerId: string) {
    return getCollectionCardsForOwnerWithVisibility(ownerId, undefined)
  }

  // which of the owner's collections contain this asset - drives the
  // picker's checkbox states; user client only (owner filter + RLS)
  async function getCollectionIdsForAsset(
    ownerId: string,
    assetKey: AssetKey,
  ): Promise<Result<Array<CollectionId>>> {
    const { data, error: pgError } = await client
      .from('collection_items')
      // empty embeds keep the inner joins for the owner/asset filters below
      // without shipping their columns; only collection_id is read
      .select(
        'collection_id, collections!inner(), asset_preview_snapshots!inner()',
      )
      .eq('collections.owner_id', ownerId)
      .eq('asset_preview_snapshots.provider_id', assetKey.providerId)
      .eq('asset_preview_snapshots.external_id', assetKey.externalId)
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    const { data: rows, error: parseError } = z
      .array(z.object({ collection_id: z.uuid() }))
      .safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok(rows.map((row) => row.collection_id))
  }

  // null = missing OR private-to-someone-else; callers map both to not-found
  async function getCollection(
    collectionId: CollectionId,
  ): Promise<Result<Collection | null>> {
    const { data, error: pgError } = await client
      .from('collections')
      .select(COLLECTION_COLUMNS)
      .eq('id', collectionId)
      .maybeSingle()
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    if (data === null) {
      return Ok(null)
    }
    const { data: row, error: parseError } = dbCollectionSchema.safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok(mapCollection(row))
  }

  async function getCollectionItemEdges(
    collectionId: CollectionId,
    { page, pageSize }: Pagination,
  ): Promise<Result<PaginatedCollection<CollectionItemEdge>>> {
    const {
      data,
      error: pgError,
      count,
    } = await client
      .from('collection_items')
      .select(
        'created_at, position, asset_preview_snapshots (id, provider_id, external_id)',
        { count: 'exact' },
      )
      .eq('collection_id', collectionId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
      // asset_preview_snapshot_id is unique within a collection (PK), so it
      // is the stable final key that keeps offset pages from drifting
      .order('asset_preview_snapshot_id', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)
    if (pgError) {
      return Err({ message: pgError.message, cause: pgError })
    }
    const { data: rows, error: parseError } =
      dbCollectionItemEdgesSchema.safeParse(data)
    if (parseError) {
      return Err({ message: parseError.message, cause: parseError })
    }
    return Ok({
      items: rows.map(mapCollectionItemEdge),
      pagination: {
        next:
          count == null
            ? null
            : pageNumberCursor(calculateNextPage({ page, pageSize }, count)),
        total: count ?? 0,
      },
    })
  }

  return {
    getUserCollections,
    getPublicCollectionsForOwner,
    getPublicCollectionCardsForOwner,
    getCollectionCardsForOwner,
    getCollectionIdsForAsset,
    getCollection,
    getCollectionItemEdges,
  }
}

// the public client: public-surface reads must not vary by viewer, so a
// private collection stays not-found even for its owner here. Owner-scoped
// listings build their own repo from the user client.
export function usePublicCollectionsRepo() {
  const publicSupabaseClient = usePublicSupabaseClient()
  return useMemo(
    () => makeCollectionsRepo(publicSupabaseClient),
    [publicSupabaseClient],
  )
}

export function useUserCollectionsRepo() {
  const userSupabaseClient = useUserSupabaseClient()
  return useMemo(
    () => makeCollectionsRepo(userSupabaseClient),
    [userSupabaseClient],
  )
}
