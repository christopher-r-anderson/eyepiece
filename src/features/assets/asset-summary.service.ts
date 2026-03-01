import { z } from 'zod'
import type { AssetSummary, AssetSummaryId } from '@/domain/asset/asset.schemas'
import {
  assetSummaryIdSchema,
  externalAssetIdSchema,
} from '@/domain/asset/asset.schemas'
import { Err, Ok } from '@/lib/result'
import { createPublicSupabaseClient } from '@/integrations/supabase/public'
import { providerSchema } from '@/domain/provider/provider.schemas'

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

export async function getAssetSummaries(
  assetSummaryIds: Array<AssetSummaryId>,
) {
  const { data, error: pgError } = await createPublicSupabaseClient()
    .from('asset_summaries')
    .select(
      'id, provider, external_id, title, thumb_href, thumb_width, thumb_height',
    )
    .in('id', assetSummaryIds)
  if (pgError) {
    return Err({
      message: pgError.message,
      cause: pgError,
    })
  }
  const { data: dbAssetSummaries, error: parseError } =
    dbAssetSummariesSchema.safeParse(data)
  if (parseError) {
    return Err({
      message: parseError.message,
      cause: parseError,
    })
  }
  return Ok(dbAssetSummaries.map(mapAssetSummary))
}
