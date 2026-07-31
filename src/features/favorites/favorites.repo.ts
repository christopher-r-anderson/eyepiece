import { z } from 'zod'
import { useMemo } from 'react'
import {
  decodeFavoritesEdgesCursor,
  encodeFavoritesEdgesCursor,
} from './favorites.cursor'
import type { FavoritesEdgesCursor } from './favorites.cursor'
import type { FavoriteEdge } from './favorites.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { PaginatedCollection } from '@/domain/pagination/pagination.schema'
import { Err, Ok, resultIsError } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schema'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { useUserSupabaseClient } from '@/integrations/supabase/user.hooks'

const dbUserFavoriteIndexSchema = z.object({
  asset_preview_snapshots: z.object({
    provider_id: providerIdSchema,
    external_id: externalAssetIdSchema,
  }),
})

type DbUserFavoriteIndex = z.infer<typeof dbUserFavoriteIndexSchema>

const dbUserFavoritesIndexSchema = z.array(dbUserFavoriteIndexSchema)

const userFavoriteIndexSchema = z.object({
  providerId: providerIdSchema,
  externalId: externalAssetIdSchema,
})

type UserFavoriteIndex = z.infer<typeof userFavoriteIndexSchema>

function mapUserFavoritesIndex({
  asset_preview_snapshots: { provider_id, external_id },
}: DbUserFavoriteIndex): UserFavoriteIndex {
  return {
    providerId: provider_id,
    externalId: external_id,
  }
}

const dbUserFavoritesEdgeSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  asset_preview_snapshots: z.object({
    id: z.uuid(),
    provider_id: providerIdSchema,
    external_id: externalAssetIdSchema,
  }),
})

type DbUserFavoritesEdge = z.infer<typeof dbUserFavoritesEdgeSchema>

const dbUserFavoritesEdgesSchema = z.array(dbUserFavoritesEdgeSchema)

function mapUserFavoritesEdges(
  favoriteEdge: DbUserFavoritesEdge,
): FavoriteEdge {
  return {
    createdAt: favoriteEdge.created_at,
    assetPreviewSnapshotId: favoriteEdge.asset_preview_snapshots.id,
    assetKey: {
      providerId: favoriteEdge.asset_preview_snapshots.provider_id,
      externalId: favoriteEdge.asset_preview_snapshots.external_id,
    },
  }
}

export type FavoritesEdgesPageRequest = {
  cursor: string | null
  pageSize: number
}

export type UserFavoritesRepo = {
  getUserFavoritesEdges: (
    request: FavoritesEdgesPageRequest,
  ) => Promise<Result<PaginatedCollection<FavoriteEdge>>>
  getUserFavoritesIndex: () => Promise<Result<Array<UserFavoriteIndex>>>
}

export function makeUserFavoritesRepo(client: SupabaseClient) {
  // Keyset pagination on (created_at DESC, asset_preview_snapshot_id DESC):
  // a page is the rows strictly after the cursor in that order, so rows
  // removed or restored before the cursor cannot shift it (#209).
  async function getUserFavoritesEdges({
    cursor,
    pageSize,
  }: FavoritesEdgesPageRequest) {
    let after: FavoritesEdgesCursor | null = null
    if (cursor !== null) {
      const decoded = decodeFavoritesEdgesCursor(cursor)
      if (resultIsError(decoded)) {
        return decoded
      }
      after = decoded.data
    }
    let pageQuery = client
      .from('favorites')
      .select(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
      )
      .order('created_at', { ascending: false })
      .order('asset_preview_snapshot_id', { ascending: false })
      // one row past the page proves a next page without trusting counts
      .limit(pageSize + 1)
    if (after) {
      pageQuery = pageQuery.or(
        `created_at.lt."${after.createdAt}",and(created_at.eq."${after.createdAt}",asset_preview_snapshot_id.lt.${after.snapshotId})`,
      )
    }
    const [{ data, error: pgError }, { count, error: countError }] =
      await Promise.all([
        pageQuery,
        client.from('favorites').select('*', { count: 'exact', head: true }),
      ])
    if (pgError) {
      return Err({
        message: pgError.message,
        cause: pgError,
      })
    }
    if (countError) {
      return Err({
        message: countError.message,
        cause: countError,
      })
    }
    const { data: userFavoritesEdges, error: parseError } =
      dbUserFavoritesEdgesSchema.safeParse(data)
    if (parseError) {
      return Err({
        message: parseError.message,
        cause: parseError,
      })
    }
    const hasMore = userFavoritesEdges.length > pageSize
    const items = (
      hasMore ? userFavoritesEdges.slice(0, pageSize) : userFavoritesEdges
    ).map(mapUserFavoritesEdges)
    return Ok({
      items,
      pagination: {
        next: hasMore
          ? encodeFavoritesEdgesCursor(items[items.length - 1])
          : null,
        total: count ?? 0,
      },
    })
  }

  // NOTE: this returns all favorites for use as an in memory index. For *extremely heavy users* this could be a performance issue.
  async function getUserFavoritesIndex() {
    const { data, error: pgError } = await client
      .from('favorites')
      .select('asset_preview_snapshots (provider_id, external_id)')
      .order('created_at', { ascending: false })
    if (pgError) {
      return Err({
        message: pgError.message,
        cause: pgError,
      })
    }
    const { data: userFavorites, error: parseError } =
      dbUserFavoritesIndexSchema.safeParse(data)
    if (parseError) {
      return Err({
        message: parseError.message,
        cause: parseError,
      })
    }
    return Ok(userFavorites.map(mapUserFavoritesIndex))
  }

  return {
    getUserFavoritesEdges,
    getUserFavoritesIndex,
  }
}

export function useUserFavoritesRepo() {
  const userSupabaseClient = useUserSupabaseClient()
  return useMemo(
    () => makeUserFavoritesRepo(userSupabaseClient),
    [userSupabaseClient],
  )
}
