import { useCallback } from 'react'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { useQueueToastMessage } from '@/components/ui/toast.hooks'
import { useShowLoginModal } from '@/features/auth/hooks/use-show-auth-modal'
import { ToggleFavoriteButton } from '@/features/favorites/components/toggle-favorite-button'

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
    <ToggleFavoriteButton
      assetKey={assetKey}
      onUnauthorized={showLoginModal}
      onError={showErrorToast}
    />
  )
}
