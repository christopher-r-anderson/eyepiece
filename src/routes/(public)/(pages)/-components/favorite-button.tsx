import { ClientOnly } from '@tanstack/react-router'
import { StarIcon } from '@phosphor-icons/react/dist/ssr'
import { useCallback } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { ToggleButton } from '@/components/ui/toggle-button'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { PublicToggleFavoriteButton } from '@/features/favorites/components/public-toggle-favorite-button'

const favoriteToggleFallbackCss = {
  '--toggle-icon-color': 'var(--favorite-toggle-idle)',
  opacity: 0.75,
}

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
      <PublicToggleFavoriteButton
        assetKey={assetKey}
        onUnauthorized={showLoginModal}
        onError={showErrorToast}
      />
    </ClientOnly>
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
