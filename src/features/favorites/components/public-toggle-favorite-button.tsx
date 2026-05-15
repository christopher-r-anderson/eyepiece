import { useMemo } from 'react'
import { ToggleFavoriteButton } from './toggle-favorite-button'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { createUserSupabaseClient } from '@/integrations/supabase/user'
import { UserSupabaseClientProvider } from '@/integrations/supabase/providers/user-provider'

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
  const userSupabaseClient = useMemo(() => createUserSupabaseClient(), [])

  return (
    <UserSupabaseClientProvider userSupabaseClient={userSupabaseClient}>
      <ToggleFavoriteButton
        assetKey={assetKey}
        onUnauthorized={onUnauthorized}
        onError={onError}
      />
    </UserSupabaseClientProvider>
  )
}
