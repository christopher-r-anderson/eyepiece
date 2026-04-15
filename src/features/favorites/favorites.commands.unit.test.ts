import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeUserFavoritesCommands } from './favorites.commands'
import { toggleFavorite } from './favorites.functions'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { resultIsError, resultIsSuccess } from '@/lib/result'

// ---------------------------------------------------------------------------
// favorites.functions is mocked at the top level so that importing
// favorites.commands never triggers favorites.functions' module-scope
// createServerFn() call.
// ---------------------------------------------------------------------------

vi.mock('./favorites.functions', () => ({
  toggleFavorite: vi.fn(),
}))

const mockToggleFavorite = vi.mocked(toggleFavorite)

const ASSET_KEY: AssetKey = {
  providerId: 'nasa_ivl',
  externalId: 'ARC-1998-AC98-0418-6',
}

const TOGGLE_RESULT = {
  assetSummaryId: '550e8400-e29b-41d4-a716-446655440001' as const,
  isFavorited: true,
}

describe('makeUserFavoritesCommands().toggleFavorite', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns Ok wrapping the resolved value on success', async () => {
    mockToggleFavorite.mockResolvedValueOnce(TOGGLE_RESULT)
    const commands = makeUserFavoritesCommands()

    const result = await commands.toggleFavorite(ASSET_KEY)

    expect(resultIsSuccess(result)).toBe(true)
    if (resultIsSuccess(result)) {
      expect(result.data).toEqual(TOGGLE_RESULT)
    }
  })

  it('calls toggleFavorite with { data: input }', async () => {
    mockToggleFavorite.mockResolvedValueOnce(TOGGLE_RESULT)
    const commands = makeUserFavoritesCommands()

    await commands.toggleFavorite(ASSET_KEY)

    expect(mockToggleFavorite).toHaveBeenCalledOnce()
    expect(mockToggleFavorite).toHaveBeenCalledWith({ data: ASSET_KEY })
  })

  it('returns Err with the error message and cause when an Error is thrown', async () => {
    const thrown = new Error('not authenticated')
    mockToggleFavorite.mockRejectedValueOnce(thrown)
    const commands = makeUserFavoritesCommands()

    const result = await commands.toggleFavorite(ASSET_KEY)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe('not authenticated')
      expect(result.error.cause).toBe(thrown)
    }
  })

  it('returns Err with a fallback message when a non-Error is thrown', async () => {
    mockToggleFavorite.mockRejectedValueOnce('oops plain string')
    const commands = makeUserFavoritesCommands()

    const result = await commands.toggleFavorite(ASSET_KEY)

    expect(resultIsError(result)).toBe(true)
    if (resultIsError(result)) {
      expect(result.error.message).toBe(
        'An unknown (and invalid) error occurred',
      )
    }
  })
})
