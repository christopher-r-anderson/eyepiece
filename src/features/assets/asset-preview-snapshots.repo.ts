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
  renditionSchema,
} from '@/domain/asset/asset.schema'
import * as result from '@/lib/result'
import { providerIdSchema } from '@/domain/provider/provider.schema'
import { usePublicSupabaseClient } from '@/integrations/supabase/providers/public-provider'

export const dbAssetPreviewSnapshotSchema = z.object({
  id: assetPreviewSnapshotIdSchema,
  provider_id: providerIdSchema,
  external_id: externalAssetIdSchema,
  title: z.string().nullable(),
  image_width: z.number().int().positive().nullable(),
  image_height: z.number().int().positive().nullable(),
  renditions: z.array(renditionSchema).nonempty().nullable(),
})

const dbAssetPreviewSnapshotsSchema = z.array(dbAssetPreviewSnapshotSchema)

type DbAssetPreviewSnapshot = z.infer<typeof dbAssetPreviewSnapshotSchema>

export function mapAssetPreviewSnapshot({
  id,
  provider_id,
  external_id,
  title,
  image_width,
  image_height,
  renditions,
}: DbAssetPreviewSnapshot): AssetPreviewSnapshot {
  return {
    id,
    key: {
      providerId: provider_id,
      externalId: external_id,
    },
    title: title ?? 'No Title',
    image:
      image_width && image_height && renditions
        ? { width: image_width, height: image_height, renditions }
        : undefined,
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
          'id, provider_id, external_id, title, image_width, image_height, renditions',
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
