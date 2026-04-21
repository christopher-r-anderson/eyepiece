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
  '--toggle-icon-color': 'var(--favorite-toggle-idle)',
  '--toggle-icon-hover-color': 'var(--favorite-toggle-hover)',
  '--toggle-icon-hover-glow': 'var(--favorite-toggle-glow)',
  '--toggle-icon-selected-color': 'var(--favorite-toggle-selected)',
  '--toggle-icon-selected-glow': 'var(--favorite-toggle-glow)',
  '&[data-hovered="true"]': {
    transform: 'scale(1.06)',
  },
  '&[data-selected="true"]': {
    transform: 'scale(1.02)',
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
      variant="icon"
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
    >
      <StarIcon size={20} weight={isSelected ? 'fill' : 'regular'} />
    </ToggleButton>
  )
}
