import { useNavigate, useRouterState } from '@tanstack/react-router'
import { InfoIcon } from '@phosphor-icons/react/dist/ssr'
import { MetadataModal } from './modal'
import type { AssetKey } from '@/domain/asset/asset.schema'
import { Button } from '@/components/ui/button'
import { usePrefetchMetadata } from '@/features/assets/assets.queries'

const METADATA_HASH = 'metadata'

export function MetadataButton({ assetKey }: { assetKey: AssetKey }) {
  const navigate = useNavigate()

  const isOpen = useRouterState({
    select: (s) => s.location.hash === METADATA_HASH,
  })

  const open = () =>
    navigate({ hash: METADATA_HASH, replace: false, viewTransition: false })
  const close = () =>
    navigate({ hash: '', replace: false, viewTransition: false })
  // NOTE: this gets spammed on every hover/focus/press - add throttle if staleTime is removed
  const prefetch = usePrefetchMetadata(assetKey)
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
        assetKey={assetKey}
        isOpen={isOpen}
        onOpenChange={(shouldOpen: boolean) => (shouldOpen ? open() : close())}
      />
    </>
  )
}
