import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { useHydrated } from '@tanstack/react-router'
import { useCallback } from 'react'
import { ToggleFavoriteErrorCodes } from '../favorites.const'
import {
  useToggleUserFavorite,
  useUserFavoritesIndex,
} from '../favorites.queries'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { ToggleButton } from '@/components/ui/toggle-button'
import { assetKeyIsEqual } from '@/domain/asset/asset.utils'

const favoriteToggleCss = {
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#6a6a6a',
  '&[data-hovered="true"]': {
    color: '#ffdf00',
  },
}

interface ToggleFavoriteButtonProps {
  assetKey: AssetKey
  onUnauthorized: () => void
  onError: (error: unknown) => void
}

export function ToggleFavoriteButton({
  assetKey,
  onUnauthorized,
  onError,
}: ToggleFavoriteButtonProps) {
  const isHydrated = useHydrated()
  const favorites = useUserFavoritesIndex({ enabled: isHydrated })
  const toggle = useToggleUserFavorite()
  // the array is structurally shared so this is possibly better than the cost of creating a set for every asset tile and is unlikely to be an problem at this scale
  const isFavorite =
    favorites.data?.some((key) => assetKeyIsEqual(key, assetKey)) ?? false
  const isCurrentToggle = toggle.variables
    ? assetKeyIsEqual(toggle.variables, assetKey)
    : false
  const isSelected =
    toggle.isPending && isCurrentToggle ? !isFavorite : isFavorite
  const isDisabled = !isHydrated || favorites.isPending || toggle.isPending
  const onChange = useCallback(
    () =>
      toggle.mutate(assetKey, {
        onError: (toggleFavoritesError) => {
          if (
            toggleFavoritesError.message ===
            ToggleFavoriteErrorCodes.AUTH_REQUIRED
          ) {
            onUnauthorized()
          } else {
            console.error('Error toggling favorite', toggleFavoritesError)
            onError(toggleFavoritesError)
          }
        },
      }),
    [assetKey, onError, onUnauthorized, toggle.mutate],
  )
  return (
    <ToggleButton
      aria-label="Star"
      css={favoriteToggleCss}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
    >
      <StarIcon size={18} weight={isSelected ? 'fill' : undefined} />
    </ToggleButton>
  )
}
