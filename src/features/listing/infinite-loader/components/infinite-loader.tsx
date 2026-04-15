import { startTransition, useEffect } from 'react'
import { LoadMoreButton } from './load-more-button'
import type { ComponentPropsWithoutRef } from 'react'
import { useInfiniteStatus } from '@/features/listing/infinite-loader/hooks/use-infinite-status'
import { useLoadMoreController } from '@/features/listing/infinite-loader/hooks/use-load-more-controller'
import { VisuallyHidden } from '@/components/ui/a11y'

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
      <div css={{ position: 'relative' }}>
        <VisuallyHidden>
          <div role="status" aria-live="polite" aria-atomic="true">
            {status}
          </div>
        </VisuallyHidden>
      </div>

      <div ref={sentinelRef} />

      {showLoadMore && (
        <div css={{ marginTop: '1rem', textAlign: 'center' }}>
          <LoadMoreButton
            type="button"
            disabled={isFetchingNextPage}
            onClick={async () => {
              await fetchNextPage()
              startTransition(() => {
                resetAuto()
              })
            }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </LoadMoreButton>
        </div>
      )}
    </div>
  )
}
