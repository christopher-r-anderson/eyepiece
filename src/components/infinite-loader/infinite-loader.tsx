import { startTransition, useEffect } from 'react'
import { css } from 'styled-system/css'
import { VisuallyHidden } from 'styled-system/jsx'
import { useInfiniteStatus } from './use-infinite-status'
import { useLoadMoreController } from './use-load-more-controller'
import type { ComponentPropsWithoutRef } from 'react'
import type { ButtonProps } from '@/components/ui/button'
import { Button } from '@/components/ui/button'

export function InfiniteLoader({
  children,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
  loadedCount = 0,
  total,
  loadMoreVariant,
  uiResetKey,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown | Promise<unknown>
  hasNextPage: boolean
  loadedCount?: number
  // renders a visible "showing n of total" line when provided
  total?: number
  loadMoreVariant?: ButtonProps['variant']
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

      {(showLoadMore || total !== undefined) && (
        <div
          className={css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2',
            paddingBlock: '5',
          })}
        >
          {total !== undefined && (
            <span
              className={css({
                textStyle: 'meta',
                textTransform: 'lowercase',
                color: 'text.muted',
              })}
            >
              showing {loadedCount} of {total}
            </span>
          )}
          {showLoadMore && (
            <Button
              variant={loadMoreVariant}
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
          )}
        </div>
      )}
    </div>
  )
}
