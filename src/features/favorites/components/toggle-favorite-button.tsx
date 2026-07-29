import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { useHydrated } from '@tanstack/react-router'
import { useCallback } from 'react'
import { css } from 'styled-system/css'
import {
  useToggleUserFavorite,
  useUserFavoritesIndex,
} from '../favorites.queries'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { ToggleButton } from '@/components/ui/toggle-button'
import { assetKeyIsEqual } from '@/domain/asset/asset.utils'
import { isAuthRequiredError } from '@/lib/result'

export const favoriteToggleCss = css.raw({
  '--toggle-icon-color': 'token(colors.text.muted)',
  '--toggle-icon-hover-color': 'token(colors.star)',
  '--toggle-icon-selected-color': 'token(colors.star)',
})

// both labels occupy the same cell so the control's width never shifts on
// toggle; the accessible name stays on the button
const labelSwapCss = css({
  display: 'inline-grid',
  justifyItems: 'start',
  '& > span': { gridArea: '1 / 1' },
  '& > span[data-inactive]': { visibility: 'hidden' },
})

export type ToggleFavoriteVariant = 'tile' | 'detail'

interface ToggleFavoriteButtonProps {
  assetKey: AssetKey
  onUnauthorized: () => void
  onError: (error: unknown) => void
  variant?: ToggleFavoriteVariant
}

export function FavoriteLabelSwap({ isSelected }: { isSelected: boolean }) {
  return (
    <span className={labelSwapCss} aria-hidden="true">
      <span data-inactive={isSelected ? '' : undefined}>star</span>
      <span data-inactive={isSelected ? undefined : ''}>starred</span>
    </span>
  )
}

export function ToggleFavoriteButton({
  assetKey,
  onUnauthorized,
  onError,
  variant = 'tile',
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
          if (isAuthRequiredError(toggleFavoritesError)) {
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
      variant={variant === 'detail' ? 'text' : 'icon'}
      isSelected={isSelected}
      isDisabled={isDisabled}
      onChange={onChange}
    >
      <StarIcon size={20} weight={isSelected ? 'fill' : 'regular'} />
      {variant === 'detail' && <FavoriteLabelSwap isSelected={isSelected} />}
    </ToggleButton>
  )
}
