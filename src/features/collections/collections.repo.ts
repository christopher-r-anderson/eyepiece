import { z } from 'zod'
import { useMemo } from 'react'
import { collectionVisibilitySchema } from './collections.schema'
import type {
  Collection,
  CollectionCard,
  CollectionId,
  CollectionItemEdge,
} from './collections.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import { Err, Ok } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schema'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

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

const dbSnapshotEmbedSchema = z.object({
  id: z.uuid(),
  provider_id: providerIdSchema,
  external_id: externalAssetIdSchema,
  title: z.string().nullable(),
  thumb_href: z.url(),
  thumb_width: z.number().int().positive(),
  thumb_height: z.number().int().positive(),
})

const dbCollectionCardSchema = dbCollectionSchema.extend({
  item_count: z.array(z.object({ count: z.number().int().nonnegative() })),
  cover_items: z.array(
    z.object({ asset_preview_snapshots: dbSnapshotEmbedSchema }),
  ),
})

type DbCollectionCard = z.infer<typeof dbCollectionCardSchema>

const dbCollectionCardsSchema = z.array(dbCollectionCardSchema)

function mapCollectionCard(row: DbCollectionCard): CollectionCard {
  const coverRow = row.cover_items.at(0)?.asset_preview_snapshots
  return {
    collection: mapCollection(row),
    itemCount: row.item_count.at(0)?.count ?? 0,
    cover: coverRow
      ? {
          id: coverRow.id,
          key: {
            providerId: coverRow.provider_id,
            externalId: coverRow.external_id,
          },
          title: coverRow.title ?? 'No Title',
          thumbnail: {
            href: coverRow.thumb_href,
            width: coverRow.thumb_width,
            height: coverRow.thumb_height,
          },
        }
      : null,
  }
}

const dbCollectionItemEdgeSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
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

  async function getPublicCollectionCardsForOwner(
    ownerId: string,
  ): Promise<Result<Array<CollectionCard>>> {
    const { data, error: pgError } = await client
      .from('collections')
      .select(
        `${COLLECTION_COLUMNS}, item_count:collection_items(count), cover_items:collection_items(asset_preview_snapshots(id, provider_id, external_id, title, thumb_href, thumb_width, thumb_height))`,
      )
      .eq('owner_id', ownerId)
      .eq('visibility', 'public')
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
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
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
    const hasNext = count != null && page * pageSize < count
    return Ok({
      items: rows.map(mapCollectionItemEdge),
      pagination: { next: hasNext ? page + 1 : null, total: count ?? 0 },
    })
  }

  return {
    getUserCollections,
    getPublicCollectionsForOwner,
    getPublicCollectionCardsForOwner,
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
