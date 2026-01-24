import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { InfoIcon } from '@phosphor-icons/react/dist/ssr'
import { useCallback } from 'react'
import { MetadataModal } from './modal'
import { Button } from '@/components/ui/button'
import { getMetadataOptions } from '@/features/assets/api/asset-queries'
import { useEyepieceClient } from '@/lib/api/eyepiece/eyepiece-client-provider'

const METADATA_HASH = 'metadata'

export function MetadataButton({ id }: { id: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const eyepieceClient = useEyepieceClient()

  const isOpen = useRouterState({
    select: (s) => s.location.hash === METADATA_HASH,
  })

  const open = () =>
    navigate({ hash: METADATA_HASH, replace: false, viewTransition: false })
  const close = () =>
    navigate({ hash: '', replace: false, viewTransition: false })

  const prefetch = useCallback(() => {
    // NOTE: this gets spammed on every hover/focus/press - add throttle if staleTime is removed
    void queryClient.prefetchQuery(getMetadataOptions(eyepieceClient, id))
  }, [queryClient, id])
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
        assetId={id}
        isOpen={isOpen}
        onOpenChange={(shouldOpen: boolean) => (shouldOpen ? open() : close())}
      />
    </>
  )
}
