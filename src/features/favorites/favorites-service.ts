import { z } from 'zod'
import type { FavoriteEdge } from './favorites.schemas'
import type { Result } from '@/lib/result'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Err, Ok } from '@/lib/result'
import { externalAssetIdSchema } from '@/domain/asset/asset.schemas'
import { providerSchema } from '@/domain/provider/provider.schemas'

export const DEFAULT_PAGE_SIZE = 24

const dbUserFavoriteIndexSchema = z.object({
  asset_summaries: z.object({
    provider: providerSchema,
    external_id: externalAssetIdSchema,
  }),
})

const dbUserFavoritesIndexSchema = z.array(dbUserFavoriteIndexSchema)

type DbUserFavoritesIndex = z.infer<typeof dbUserFavoritesIndexSchema>

function mapUserFavoritesIndex({
  asset_summaries: { provider, external_id },
}: DbUserFavoritesIndex[number]) {
  return {
    provider,
    externalId: external_id,
  }
}

export async function getUserFavoritesIndex() {
  const { data, error: pgError } = await createSupabaseClient()
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

export async function getUserFavoritesEdges({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: { page?: number; pageSize?: number } = {}): Promise<
  Result<UserFavoritesEdgesPage>
> {
  const {
    data,
    error: pgError,
    count,
  } = await createSupabaseClient()
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
