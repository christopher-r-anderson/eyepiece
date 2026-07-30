import { ClientOnly } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { useCallback } from 'react'
import { css } from 'styled-system/css'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { ToggleFavoriteVariant } from '@/features/favorites/components/toggle-favorite-button'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import {
  FavoriteLabelSwap,
  ToggleFavoriteButton,
  favoriteToggleCss,
} from '@/features/favorites/components/toggle-favorite-button'

// compose the real button's styles so the pre-hydration fallback cannot drift
const favoriteToggleFallbackCss = css.raw(favoriteToggleCss, {
  opacity: 0.75,
})

export function FavoriteButton({
  assetKey,
  variant = 'tile',
}: {
  assetKey: AssetKey
  variant?: ToggleFavoriteVariant
}) {
  const queueToastMessage = useQueueToastMessage()
  const showLoginModal = useShowLoginModal()
  const showErrorToast = useCallback(
    () =>
      queueToastMessage({
        title: 'Error toggling favorite',
        description:
          'An unexpected error occurred while toggling favorite status.',
      }),
    [queueToastMessage],
  )

  return (
    <ClientOnly fallback={<FavoriteButtonFallback variant={variant} />}>
      <FavoriteButtonContent
        assetKey={assetKey}
        variant={variant}
        onUnauthorized={showLoginModal}
        onError={showErrorToast}
      />
    </ClientOnly>
  )
}

function FavoriteButtonContent({
  assetKey,
  variant,
  onUnauthorized,
  onError,
}: {
  assetKey: AssetKey
  variant: ToggleFavoriteVariant
  onUnauthorized: () => void
  onError: () => void
}) {
  const { data: user, isPending } = useCurrentUserQuery()
  if (!user) {
    // the known-logged-out case prompts without a server round trip; the
    // real button's AUTH_REQUIRED handling stays for mid-session expiry
    return (
      <ToggleButton
        aria-label="Star"
        variant={variant === 'detail' ? 'text' : 'icon'}
        css={favoriteToggleCss}
        isDisabled={isPending}
        // controlled and never selected: an uncontrolled toggle would
        // commit aria-pressed=true even though nothing was favorited
        isSelected={false}
        onChange={onUnauthorized}
      >
        <StarIcon size={20} weight="regular" />
        {variant === 'detail' && <FavoriteLabelSwap isSelected={false} />}
      </ToggleButton>
    )
  }
  return (
    <ToggleFavoriteButton
      assetKey={assetKey}
      variant={variant}
      onUnauthorized={onUnauthorized}
      onError={onError}
    />
  )
}

function FavoriteButtonFallback({
  variant,
}: {
  variant: ToggleFavoriteVariant
}) {
  return (
    <ToggleButton
      aria-label="Star"
      variant={variant === 'detail' ? 'text' : 'icon'}
      css={favoriteToggleFallbackCss}
      isDisabled
    >
      <StarIcon size={20} weight="regular" />
      {variant === 'detail' && <FavoriteLabelSwap isSelected={false} />}
    </ToggleButton>
  )
}
