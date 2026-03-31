import { z } from 'zod'
import type {
  AssetPreviewSnapshot,
  AssetPreviewSnapshotId,
} from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Result } from '@/lib/result'
import {
  assetPreviewSnapshotIdSchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import * as result from '@/lib/result'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

const dbAssetPreviewSnapshotSchema = z.object({
  id: assetPreviewSnapshotIdSchema,
  provider_id: providerIdSchema,
  external_id: externalAssetIdSchema,
  title: z.string().nullable(),
  thumb_href: z.url(),
  thumb_width: z.number().int().positive(),
  thumb_height: z.number().int().positive(),
})

const dbAssetPreviewSnapshotsSchema = z.array(dbAssetPreviewSnapshotSchema)

type DbAssetPreviewSnapshot = z.infer<typeof dbAssetPreviewSnapshotSchema>

function mapAssetPreviewSnapshot({
  id,
  provider_id,
  external_id,
  title,
  thumb_href,
  thumb_width,
  thumb_height,
}: DbAssetPreviewSnapshot): AssetPreviewSnapshot {
  return {
    id,
    key: {
      providerId: provider_id,
      externalId: external_id,
    },
    title: title ?? 'No Title',
    thumbnail: {
      href: thumb_href,
      width: thumb_width,
      height: thumb_height,
    },
  }
}

export type AssetPreviewSnapshotsRepo = {
  getAssetPreviewSnapshots: (
    assetPreviewSnapshotIds: Array<AssetPreviewSnapshotId>,
  ) => Promise<Result<Array<AssetPreviewSnapshot>>>
}

export function makeAssetPreviewSnapshotsRepo(
  publicSupabaseClient: SupabaseClient,
) {
  return {
    getAssetPreviewSnapshots: async (
      assetPreviewSnapshotIds: Array<AssetPreviewSnapshotId>,
    ) => {
      const { data, error: pgError } = await publicSupabaseClient
        .from('asset_preview_snapshots')
        .select(
          'id, provider_id, external_id, title, thumb_href, thumb_width, thumb_height',
        )
        .in('id', assetPreviewSnapshotIds)
      if (pgError) {
        return result.Err({
          message: pgError.message,
          cause: pgError,
        })
      }
      const { data: dbAssetPreviewSnapshots, error: parseError } =
        dbAssetPreviewSnapshotsSchema.safeParse(data)
      if (parseError) {
        return result.Err({
          message: parseError.message,
          cause: parseError,
        })
      }
      return result.Ok(dbAssetPreviewSnapshots.map(mapAssetPreviewSnapshot))
    },
  }
}

export function useAssetPreviewSnapshotsRepo() {
  const publicSupabaseClient = usePublicSupabaseClient()
  return makeAssetPreviewSnapshotsRepo(publicSupabaseClient)
}
