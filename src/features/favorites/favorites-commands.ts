import { toggleFavorite } from './favorites.functions'
import type { AssetKey } from '@/domain/asset/asset.schemas'
import type { ToggleFavoriteResult } from './favorites.schemas'
import type { Result } from '@/lib/result'
import { Err, Ok } from '@/lib/result'

export interface UserFavoritesCommands {
  toggleFavorite: (input: AssetKey) => Promise<Result<ToggleFavoriteResult>>
}

export const makeUserFavoritesCommands = (): UserFavoritesCommands => {
  return {
    toggleFavorite: async (
      input: AssetKey,
    ): Promise<Result<ToggleFavoriteResult>> => {
      try {
        return Ok(await toggleFavorite({ data: input }))
      } catch (error) {
        if (error instanceof Error) {
          return Err({
            message: error.message,
            cause: error,
          })
        } else {
          return Err({
            message: 'An unknown (and invalid) error occurred',
          })
        }
      }
    },
  }
}
