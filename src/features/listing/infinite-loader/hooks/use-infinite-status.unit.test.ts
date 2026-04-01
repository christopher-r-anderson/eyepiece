import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useInfiniteStatus } from './use-infinite-status'

describe('useInfiniteStatus', () => {
  it('returns an empty string in the initial state', () => {
    const { result } = renderHook(() =>
      useInfiniteStatus({
        isFetchingNextPage: false,
        loadedCount: 0,
        hasNextPage: true,
      }),
    )

    expect(result.current).toBe('')
  })

  it('sets status to the loading message when isFetchingNextPage transitions to true', () => {
    const { result, rerender } = renderHook(
      ({ isFetchingNextPage }: { isFetchingNextPage: boolean }) =>
        useInfiniteStatus({
          isFetchingNextPage,
          loadedCount: 10,
          hasNextPage: true,
        }),
      { initialProps: { isFetchingNextPage: false } },
    )

    act(() => rerender({ isFetchingNextPage: true }))

    expect(result.current).toBe('Loading more results…')
  })

  it('reports the loaded delta and running total when loadedCount increases', () => {
    const { result, rerender } = renderHook(
      ({ loadedCount }: { loadedCount: number }) =>
        useInfiniteStatus({
          isFetchingNextPage: false,
          loadedCount,
          hasNextPage: true,
        }),
      { initialProps: { loadedCount: 0 } },
    )

    act(() => rerender({ loadedCount: 24 }))

    expect(result.current).toBe('Loaded 24 more results. 24 total.')
  })

  it('uses singular phrasing when exactly one result is loaded', () => {
    const { result, rerender } = renderHook(
      ({ loadedCount }: { loadedCount: number }) =>
        useInfiniteStatus({
          isFetchingNextPage: false,
          loadedCount,
          hasNextPage: true,
        }),
      { initialProps: { loadedCount: 24 } },
    )

    act(() => rerender({ loadedCount: 25 }))

    expect(result.current).toBe('Loaded 1 more result. 25 total.')
  })

  it('tracks the cumulative delta across multiple load events', () => {
    const { result, rerender } = renderHook(
      ({ loadedCount }: { loadedCount: number }) =>
        useInfiniteStatus({
          isFetchingNextPage: false,
          loadedCount,
          hasNextPage: true,
        }),
      { initialProps: { loadedCount: 0 } },
    )

    act(() => rerender({ loadedCount: 24 }))
    act(() => rerender({ loadedCount: 48 }))

    expect(result.current).toBe('Loaded 24 more results. 48 total.')
  })

  it('announces all results loaded when hasNextPage becomes false', () => {
    const { result, rerender } = renderHook(
      ({ hasNextPage }: { hasNextPage: boolean }) =>
        useInfiniteStatus({
          isFetchingNextPage: false,
          loadedCount: 24,
          hasNextPage,
        }),
      { initialProps: { hasNextPage: true } },
    )

    act(() => rerender({ hasNextPage: false }))

    expect(result.current).toBe('All results loaded.')
  })

  it('does not announce all results loaded when loadedCount is zero', () => {
    const { result } = renderHook(() =>
      useInfiniteStatus({
        isFetchingNextPage: false,
        loadedCount: 0,
        hasNextPage: false,
      }),
    )

    expect(result.current).toBe('')
  })

  it('announces an error status when the error prop is set', () => {
    const { result, rerender } = renderHook(
      ({ error }: { error: unknown }) =>
        useInfiniteStatus({
          isFetchingNextPage: false,
          loadedCount: 0,
          hasNextPage: true,
          error,
        }),
      { initialProps: { error: undefined as unknown } },
    )

    act(() => rerender({ error: new Error('network failure') }))

    expect(result.current).toBe("Couldn't load more results.")
  })
})
