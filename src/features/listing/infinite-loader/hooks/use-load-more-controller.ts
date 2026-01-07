import { useCallback, useEffect, useRef, useState } from 'react'

export function useLoadMoreController(options: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
  autoLoadsBeforeManual?: number
  rootMargin?: string // prefetch distance
}) {
  const {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    autoLoadsBeforeManual = 2,
    rootMargin = '240px',
  } = options

  const [autoRemaining, setAutoRemaining] = useState(autoLoadsBeforeManual)
  const resetAuto = useCallback(
    () => setAutoRemaining(autoLoadsBeforeManual),
    [autoLoadsBeforeManual],
  )
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setAutoRemaining(autoLoadsBeforeManual)
  }, [autoLoadsBeforeManual])

  useEffect(() => {
    if (autoRemaining <= 0) return
    if (!hasNextPage || isFetchingNextPage) return

    const el = sentinelRef.current
    if (!el) return

    const io = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting) return

        await fetchNextPage()
        setAutoRemaining((n) => n - 1)
      },
      { root: null, rootMargin },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [
    autoRemaining,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
  ])

  const autoEnabled = autoRemaining > 0
  const showLoadMore = hasNextPage && !autoEnabled

  return {
    sentinelRef,
    autoRemaining,
    autoEnabled,
    showLoadMore,
    resetAuto,
  }
}
