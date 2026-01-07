import { useEffect, useRef, useState } from 'react'

export function useInfiniteStatus(options: {
  isFetchingNextPage: boolean
  loadedCount: number
  hasNextPage: boolean
  error?: unknown
}) {
  const { isFetchingNextPage, loadedCount, hasNextPage, error } = options
  const [status, setStatus] = useState('')
  const prevCountRef = useRef(0)

  useEffect(() => {
    if (isFetchingNextPage) setStatus('Loading more results…')
  }, [isFetchingNextPage])

  useEffect(() => {
    const prev = prevCountRef.current
    if (loadedCount > prev) {
      const delta = loadedCount - prev
      setStatus(
        `Loaded ${delta} more result${delta === 1 ? '' : 's'}. ${loadedCount} total.`,
      )
    }
    prevCountRef.current = loadedCount
  }, [loadedCount])

  useEffect(() => {
    if (!hasNextPage && loadedCount > 0) setStatus('All results loaded.')
  }, [hasNextPage, loadedCount])

  useEffect(() => {
    if (error) setStatus('Couldn\u2019t load more results.')
  }, [error])

  return status
}
