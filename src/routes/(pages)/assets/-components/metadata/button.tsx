import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { InfoIcon } from '@phosphor-icons/react/dist/ssr'
import { useCallback } from 'react'
import { MetadataModal } from './modal'
import type { AssetKey } from '@/domain/asset/asset.schema'
import type { AssetsRepo } from '@/features/assets/assets.repo'
import { Button } from '@/components/ui/button'
import { getMetadataOptions } from '@/features/assets/assets.queries'

const METADATA_HASH = 'metadata'

export function MetadataButton({
  assetKey,
  assetsRepo,
}: {
  assetKey: AssetKey
  assetsRepo: Pick<AssetsRepo, 'getMetadata'>
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isOpen = useRouterState({
    select: (s) => s.location.hash === METADATA_HASH,
  })

  const open = () =>
    navigate({ hash: METADATA_HASH, replace: false, viewTransition: false })
  const close = () =>
    navigate({ hash: '', replace: false, viewTransition: false })

  const prefetch = useCallback(() => {
    // NOTE: this gets spammed on every hover/focus/press - add throttle if staleTime is removed
    void queryClient.prefetchQuery(
      getMetadataOptions({ repo: assetsRepo, assetKey }),
    )
  }, [queryClient, assetsRepo, assetKey])
  return (
    <>
      <Button
        aria-label="View metadata"
        onPress={open}
        onHoverStart={prefetch}
        onFocus={prefetch}
        onPressStart={prefetch}
        css={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        <InfoIcon size={24} color="white" />
      </Button>

      <MetadataModal
        assetsRepo={assetsRepo}
        assetKey={assetKey}
        isOpen={isOpen}
        onOpenChange={(shouldOpen: boolean) => (shouldOpen ? open() : close())}
      />
    </>
  )
}
