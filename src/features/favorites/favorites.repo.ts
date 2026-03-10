import { z } from 'zod'
import { useMemo } from 'react'
import type { FavoriteEdge } from './favorites.schema'
import type { Result } from '@/lib/result'
import type { SupabaseClient } from '@/integrations/supabase/types'
import { Err, Ok } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schema'
import { providerSchema } from '@/domain/provider/provider.schema'
import { useUserSupabaseClient } from '@/integrations/supabase/providers/user-provider'

export const DEFAULT_PAGE_SIZE = 24

const dbUserFavoriteIndexSchema = z.object({
  asset_summaries: z.object({
    provider: providerSchema,
    external_id: externalAssetIdSchema,
  }),
})

type DbUserFavoriteIndex = z.infer<typeof dbUserFavoriteIndexSchema>

const dbUserFavoritesIndexSchema = z.array(dbUserFavoriteIndexSchema)

const userFavoriteIndexSchema = z.object({
  provider: providerSchema,
  externalId: externalAssetIdSchema,
})

export type UserFavoriteIndex = z.infer<typeof userFavoriteIndexSchema>

function mapUserFavoritesIndex({
  asset_summaries: { provider, external_id },
}: DbUserFavoriteIndex): UserFavoriteIndex {
  return {
    provider,
    externalId: external_id,
  }
}

const dbUserFavoritesEdgeSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  asset_summaries: z.object({
    id: z.uuid(),
    provider: providerSchema,
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
    assetSummaryId: favoriteEdge.asset_summaries.id,
    assetKey: {
      provider: favoriteEdge.asset_summaries.provider,
      externalId: favoriteEdge.asset_summaries.external_id,
    },
  }
}

export type UserFavoritesEdgesPage = {
  edges: Array<FavoriteEdge>
  pagination: {
    next: number | null
  }
}

export type UserFavoritesRepo = {
  getUserFavoritesEdges: (params?: {
    page?: number
    pageSize?: number
  }) => Promise<Result<UserFavoritesEdgesPage>>
  getUserFavoritesIndex: () => Promise<Result<Array<UserFavoriteIndex>>>
}

export function makeUserFavoritesRepo(client: SupabaseClient) {
  async function getUserFavoritesEdges({
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  }: { page?: number; pageSize?: number } = {}): Promise<
    Result<UserFavoritesEdgesPage>
  > {
    const {
      data,
      error: pgError,
      count,
    } = await client
      .from('favorites')
      .select('created_at, asset_summaries (id, provider, external_id)', {
        count: 'exact',
      })
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
      edges: userFavoritesEdges.map(mapUserFavoritesEdges),
      pagination: { next: hasNext ? page + 1 : null },
    })
  }

  // NOTE: this returns all favorites for use as an in memory index. For *extremely heavy users* this could be a performance issue.
  async function getUserFavoritesIndex() {
    const { data, error: pgError } = await client
      .from('favorites')
      .select('asset_summaries (provider, external_id)')
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
