import { startTransition, useEffect } from 'react'
import { css } from 'styled-system/css'
import { VisuallyHidden } from 'styled-system/jsx'
import type { ComponentPropsWithoutRef } from 'react'
import { Button } from '@/components/ui/button'
import { useInfiniteStatus } from '@/features/listing/infinite-loader/hooks/use-infinite-status'
import { useLoadMoreController } from '@/features/listing/infinite-loader/hooks/use-load-more-controller'

export function InfiniteLoader({
  children,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  loadedCount = 0,
  uiResetKey,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown | Promise<unknown>
  hasNextPage: boolean
  loadedCount?: number
  uiResetKey: string
}) {
  const status = useInfiniteStatus({
    isFetchingNextPage: isFetchingNextPage,
    loadedCount,
    hasNextPage: hasNextPage,
  })

  const { sentinelRef, showLoadMore, resetAuto } = useLoadMoreController({
    hasNextPage: hasNextPage,
    isFetchingNextPage: isFetchingNextPage,
    fetchNextPage,
    autoLoadsBeforeManual: 2,
  })

  useEffect(() => resetAuto(), [uiResetKey, resetAuto])

  return (
    <div {...props}>
      {children}
      <div className={css({ position: 'relative' })}>
        <VisuallyHidden>
          <div role="status" aria-live="polite" aria-atomic="true">
            {status}
          </div>
        </VisuallyHidden>
      </div>

      <div ref={sentinelRef} />

      {showLoadMore && (
        <div className={css({ marginTop: '4', textAlign: 'center' })}>
          <Button
            isDisabled={isFetchingNextPage}
            onPress={async () => {
              await fetchNextPage()
              startTransition(() => {
                resetAuto()
              })
            }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
