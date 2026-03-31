import { z } from 'zod'
import { useMemo } from 'react'
import type { FavoriteEdge } from './favorites.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type {
  PaginatedCollection,
  Pagination,
} from '@/domain/pagination/pagination.schema'
import { Err, Ok } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schema'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { useUserSupabaseClient } from '@/integrations/supabase/providers/user-provider'

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
    assetSummaryId: favoriteEdge.asset_preview_snapshots.id,
    assetKey: {
      providerId: favoriteEdge.asset_preview_snapshots.provider_id,
      externalId: favoriteEdge.asset_preview_snapshots.external_id,
    },
  }
}

export type UserFavoritesRepo = {
  getUserFavoritesEdges: (
    pagination: Pagination,
  ) => Promise<Result<PaginatedCollection<FavoriteEdge>>>
  getUserFavoritesIndex: () => Promise<Result<Array<UserFavoriteIndex>>>
}

export function makeUserFavoritesRepo(client: SupabaseClient) {
  async function getUserFavoritesEdges({ page, pageSize }: Pagination) {
    const {
      data,
      error: pgError,
      count,
    } = await client
      .from('favorites')
      .select(
        'created_at, asset_preview_snapshots (id, provider_id, external_id)',
        {
          count: 'exact',
        },
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
    if (pgError) {
      return Err({
        message: pgError.message,
        cause: pgError,
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
    const hasNext = count != null && page * pageSize < count
    return Ok({
      items: userFavoritesEdges.map(mapUserFavoritesEdges),
      pagination: { next: hasNext ? page + 1 : null, total: count ?? 0 },
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
  const supabaseClient = useUserSupabaseClient()
  return useMemo(() => makeUserFavoritesRepo(supabaseClient), [supabaseClient])
}
