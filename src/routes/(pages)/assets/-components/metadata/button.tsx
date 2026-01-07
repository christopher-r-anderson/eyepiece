import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from 'react-aria-components'
import { useQueryClient } from '@tanstack/react-query'
import { InfoIcon } from '@phosphor-icons/react/dist/ssr'
import { getMetadataOptions } from '@/features/assets/api/asset-queries'
import { MetadataModal } from './modal'
import { useCallback } from 'react'

const METADATA_HASH = 'metadata'

export function MetadataButton({ id }: { id: string }) {
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
    void queryClient.prefetchQuery(getMetadataOptions(id))
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
          cursor: 'pointer',
          outline: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <InfoIcon size={24} color="white" />
      </Button>

      <MetadataModal
        id={id}
        isOpen={isOpen}
        onOpenChange={(shouldOpen: boolean) => (shouldOpen ? open() : close())}
      />
    </>
  )
}
