import { z } from 'zod'
import type { AssetSummary, AssetSummaryId } from '@/domain/asset/asset.schema'
import type { SupabaseClient } from '@/integrations/supabase/types'
import type { Result } from '@/lib/result'
import {
  assetSummaryIdSchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schema'
import * as result from '@/lib/result'
import { providerSchema } from '@/domain/provider/provider.schema'

const dbAssetSummarySchema = z.object({
  id: assetSummaryIdSchema,
  provider: providerSchema,
  external_id: externalAssetIdSchema,
  title: z.string().nullable(),
  thumb_href: z.url(),
  thumb_width: z.number().int().positive(),
  thumb_height: z.number().int().positive(),
})

const dbAssetSummariesSchema = z.array(dbAssetSummarySchema)

type DbAssetSummary = z.infer<typeof dbAssetSummarySchema>

function mapAssetSummary({
  id,
  provider,
  external_id,
  title,
  thumb_href,
  thumb_width,
  thumb_height,
}: DbAssetSummary): AssetSummary {
  return {
    id,
    provider,
    externalId: external_id,
    title: title ?? 'No Title',
    thumbnail: {
      href: thumb_href,
      width: thumb_width,
      height: thumb_height,
    },
  }
}

export type AssetSummariesRepo = {
  getAssetSummaries: (
    assetSummaryIds: Array<AssetSummaryId>,
  ) => Promise<Result<Array<AssetSummary>>>
}

export function makeAssetSummariesRepo(supabaseClient: SupabaseClient) {
  return {
    getAssetSummaries: async (assetSummaryIds: Array<AssetSummaryId>) => {
      const { data, error: pgError } = await supabaseClient
        .from('asset_summaries')
        .select(
          'id, provider, external_id, title, thumb_href, thumb_width, thumb_height',
        )
        .in('id', assetSummaryIds)
      if (pgError) {
        return result.Err({
          message: pgError.message,
          cause: pgError,
        })
      }
      const { data: dbAssetSummaries, error: parseError } =
        dbAssetSummariesSchema.safeParse(data)
      if (parseError) {
        return result.Err({
          message: parseError.message,
          cause: parseError,
        })
      }
      return result.Ok(dbAssetSummaries.map(mapAssetSummary))
    },
  }
}
