import { ToggleFavoriteButton } from './toggle-favorite-button'
import type { AssetKey } from '@/domain/asset/asset.schema'

type PublicToggleFavoriteButtonProps = {
  assetKey: AssetKey
  onUnauthorized: () => void
  onError: (error: unknown) => void
}

export function PublicToggleFavoriteButton({
  assetKey,
  onUnauthorized,
  onError,
}: PublicToggleFavoriteButtonProps) {
  return (
    <ToggleFavoriteButton
      assetKey={assetKey}
      onUnauthorized={onUnauthorized}
      onError={onError}
    />
  )
}
