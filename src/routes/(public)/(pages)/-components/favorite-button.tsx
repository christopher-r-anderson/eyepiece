import { ClientOnly } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { useCallback } from 'react'
import { css } from 'styled-system/css'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { useCurrentUserQuery } from '@/features/auth/auth.queries'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import {
  ToggleFavoriteButton,
  favoriteToggleCss,
} from '@/features/favorites/components/toggle-favorite-button'

// compose the real button's styles so the pre-hydration fallback cannot drift
const favoriteToggleFallbackCss = css.raw(favoriteToggleCss, {
  opacity: 0.75,
})

export function FavoriteButton({ assetKey }: { assetKey: AssetKey }) {
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
    <ClientOnly fallback={<FavoriteButtonFallback />}>
      <FavoriteButtonContent
        assetKey={assetKey}
        onUnauthorized={showLoginModal}
        onError={showErrorToast}
      />
    </ClientOnly>
  )
}

function FavoriteButtonContent({
  assetKey,
  onUnauthorized,
  onError,
}: {
  assetKey: AssetKey
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
        variant="icon"
        css={favoriteToggleCss}
        isDisabled={isPending}
        onChange={onUnauthorized}
      >
        <StarIcon size={20} weight="regular" />
      </ToggleButton>
    )
  }
  return (
    <ToggleFavoriteButton
      assetKey={assetKey}
      onUnauthorized={onUnauthorized}
      onError={onError}
    />
  )
}

function FavoriteButtonFallback() {
  return (
    <ToggleButton
      aria-label="Star"
      variant="icon"
      css={favoriteToggleFallbackCss}
      isDisabled
    >
      <StarIcon size={20} weight="regular" />
    </ToggleButton>
  )
}
