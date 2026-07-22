import { z } from 'zod'
import { collectionVisibilitySchema } from './collections.schema'
import type {
  Collection,
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

const dbCollectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  visibility: collectionVisibilitySchema,
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
})

type DbCollection = z.infer<typeof dbCollectionSchema>

const dbCollectionsSchema = z.array(dbCollectionSchema)

export const COLLECTION_COLUMNS = 'id, name, visibility, created_at, updated_at'

export function mapCollection(row: DbCollection): Collection {
  return {
    id: row.id,
    name: row.name,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    getCollection,
    getCollectionItemEdges,
  }
}
