import { useMemo } from 'react'
import {
  
  ToggleFavoriteErrorCodes
} from './favorites.const'
import { toggleFavorite } from './favorites.functions'
import type {ToggleFavoriteErrorCode} from './favorites.const';
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { ToggleFavoriteResult } from './favorites.schema'
import type { Result, ResultError } from '@/lib/result'
import { Err, Ok, errorFromUnknown } from '@/lib/result'

function toToggleFavoriteResultError(
  error: unknown,
): ResultError<ToggleFavoriteErrorCode | undefined> {
  const resultError = errorFromUnknown(
    error,
    'An unknown (and invalid) error occurred',
  )

  return {
    ...resultError,
    code:
      resultError.code === ToggleFavoriteErrorCodes.AUTH_REQUIRED ||
      resultError.code === ToggleFavoriteErrorCodes.UNKNOWN_ERROR
        ? resultError.code
        : undefined,
  }
}

export interface UserFavoritesCommands {
  toggleFavorite: (
    input: AssetKey,
  ) => Promise<
    Result<ToggleFavoriteResult, ToggleFavoriteErrorCode | undefined>
  >
}

export const makeUserFavoritesCommands = (): UserFavoritesCommands => {
  return {
    toggleFavorite: async (
      input: AssetKey,
    ): Promise<
      Result<ToggleFavoriteResult, ToggleFavoriteErrorCode | undefined>
    > => {
      try {
        return Ok(await toggleFavorite({ data: input }))
      } catch (error) {
        return Err(toToggleFavoriteResultError(error))
      }
    },
  }
}

export function useUserFavoritesCommands() {
  return useMemo(() => makeUserFavoritesCommands(), [])
}
