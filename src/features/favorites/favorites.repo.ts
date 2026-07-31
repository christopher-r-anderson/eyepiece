import { z } from 'zod'
import { useMemo } from 'react'
import {
  decodeFavoritesEdgesCursor,
  encodeFavoritesEdgesCursor,
} from './favorites.cursor'
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
  async function getUserFavoritesEdges({
    cursor,
    pageSize,
  }: FavoritesEdgesPageRequest) {
    const decoded = cursor === null ? null : decodeFavoritesEdgesCursor(cursor)
    if (decoded && resultIsError(decoded)) {
      return decoded
    }
    const after = decoded?.data
    const probeLimit = pageSize + 1
    // the first page's count rides the page request so rows and total come
    // from one snapshot; a cursor page's filtered count cannot express the
    // total, and its total is never surfaced, so a head count suffices
    const pageQuery = client
      .from('favorites')
      .select(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
        { count: after ? undefined : 'exact' },
      )
      .order('created_at', { ascending: false })
      .order('asset_preview_snapshot_id', { ascending: false })
      .limit(probeLimit)
    const [pageResult, countResult] = await Promise.all([
      after
        ? pageQuery.or(
            `created_at.lt."${after.createdAt}",and(created_at.eq."${after.createdAt}",asset_preview_snapshot_id.lt.${after.snapshotId})`,
          )
        : pageQuery,
      after
        ? client.from('favorites').select('*', { count: 'exact', head: true })
        : null,
    ])
    const { data, error: pgError } = pageResult
    if (pgError) {
      return Err({
        message: pgError.message,
        cause: pgError,
      })
    }
    if (countResult?.error) {
      return Err({
        message: countResult.error.message,
        cause: countResult.error,
      })
    }
    const count = after ? countResult?.count : pageResult.count
    const { data: userFavoritesEdges, error: parseError } =
      dbUserFavoritesEdgesSchema.safeParse(data)
    if (parseError) {
      return Err({
        message: parseError.message,
        cause: parseError,
      })
    }
    const hasMore = userFavoritesEdges.length === probeLimit
    const items = userFavoritesEdges
      .slice(0, pageSize)
      .map(mapUserFavoritesEdges)
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
