import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { toggleFavoriteInputSchema } from './favorites.schemas'
import type {
  ToggleFavoriteInput,
  ToggleFavoriteResult,
} from './favorites.schemas'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createEyepieceClient } from '@/lib/eyepiece-api-client/client'
import { getUser } from '@/lib/supabase/user'

const ASSET_SUMMARY_STALE_TIME = 7 * 24 * 60 * 60 * 1000

export const ToggleFavoriteErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

export const toggleFavorite = createServerFn({ method: 'POST' })
  .inputValidator(toggleFavoriteInputSchema)
  // throw since `Result`s can't be used across server functions due to not being serializable (due to typing cause: unknown)
  .handler(
    async ({
      data: assetKey,
    }: {
      data: ToggleFavoriteInput
    }): Promise<ToggleFavoriteResult> => {
      const user = await getUser()
      if (!user) {
        throw new Error(ToggleFavoriteErrorCodes.AUTH_REQUIRED)
      }
      const serviceClient = createSupabaseServiceClient()
      const userClient = createSupabaseServerClient()

      let assetSummaryId

      const { data: currentAssetSummary, error: currentAssetSummaryError } =
        await serviceClient
          .from('asset_summaries')
          .select('id, updated_at')
          .eq('provider', assetKey.provider)
          .eq('external_id', assetKey.externalId)
          .maybeSingle()

      if (currentAssetSummaryError) {
        console.error(
          'Error checking existing asset summary for favorite toggle:',
          currentAssetSummaryError,
        )
        throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR, {
          cause: currentAssetSummaryError,
        })
      }
      if (currentAssetSummary) {
        const assetUpdatedAt = new Date(currentAssetSummary.updated_at)
        if (Date.now() - assetUpdatedAt.getTime() < ASSET_SUMMARY_STALE_TIME) {
          assetSummaryId = currentAssetSummary.id
        }
      }

      if (!assetSummaryId) {
        let asset
        try {
          const requestUrl = new URL(getRequest().url)
          const eyepieceClient = createEyepieceClient({
            origin: requestUrl.origin,
          })
          asset = await eyepieceClient.getAsset(assetKey)
        } catch (error) {
          console.error(
            'Error fetching asset details for favorite toggle:',
            error,
          )
          throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR, {
            cause: error,
          })
        }
        const { data: ensuredAssetSummaryId, error: ensureImageRefError } =
          await serviceClient.rpc('ensure_asset_summary', {
            p_provider: assetKey.provider,
            p_external_id: assetKey.externalId,
            p_title: asset.title,
            p_thumb_href: asset.thumbnail.href,
            p_thumb_width: asset.thumbnail.width,
            p_thumb_height: asset.thumbnail.height,
          })
        if (ensureImageRefError) {
          console.error(
            'Error ensuring image ref for favorite toggle:',
            ensureImageRefError,
          )
          throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR, {
            cause: ensureImageRefError,
          })
        }
        assetSummaryId = ensuredAssetSummaryId
      }

      if (!assetSummaryId) {
        console.error(
          'No assetSummaryId returned from ensure_asset_summary for toggle',
        )
        throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR)
      }

      const { count, error: deleteError } = await userClient
        .from('favorites')
        .delete({ count: 'exact' })
        .eq('owner_id', user.id)
        .eq('asset_summary_id', assetSummaryId)

      if (deleteError) {
        console.error('Error deleting favorite for toggle:', deleteError)
        throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR, {
          cause: deleteError,
        })
      }

      if (count === 1) {
        return { assetSummaryId, isFavorited: false }
      }

      // if nothing was deleted, insert
      const { error: insertError } = await userClient.from('favorites').insert({
        owner_id: user.id,
        asset_summary_id: assetSummaryId,
      })

      // 23505 uniqueness violation, likely a double click race condition and not a practical issue
      if (insertError && insertError.code !== '23505') {
        console.error('Error inserting favorite for toggle:', insertError)
        throw new Error(ToggleFavoriteErrorCodes.UNKNOWN_ERROR, {
          cause: insertError,
        })
      }

      return { assetSummaryId, isFavorited: true }
    },
  )
