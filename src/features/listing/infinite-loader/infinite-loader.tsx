import { ComponentPropsWithoutRef, useEffect } from 'react'
import { VisuallyHidden } from 'react-aria-components'
import { useInfiniteStatus } from './hooks/use-infinite-status'
import { useLoadMoreController } from './hooks/use-load-more-controller'
import { LoadMoreButton } from './load-more-button'

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
  fetchNextPage: () => Promise<unknown>
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
    fetchNextPage: fetchNextPage,
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
              resetAuto()
            }}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </LoadMoreButton>
        </div>
      )}
    </div>
  )
}
