import { createElement } from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoadMoreController } from './use-load-more-controller'

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------

interface MockObserverInstance {
  callback: IntersectionObserverCallback
  observe: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

let observerInstances: Array<MockObserverInstance> = []

function setupIntersectionObserverMock() {
  observerInstances = []
  class MockIntersectionObserver {
    observe = vi.fn()
    disconnect = vi.fn()

    constructor(public callback: IntersectionObserverCallback) {
      observerInstances.push({
        callback,
        observe: this.observe,
        disconnect: this.disconnect,
      })
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}

/**
 * Fire an intersection event on the most recently created observer.
 */
function fireIntersection(intersecting = true) {
  const latest = observerInstances.at(-1)
  if (!latest) throw new Error('No IntersectionObserver instance was created')
  latest.callback(
    [{ isIntersecting: intersecting } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  )
}

// ---------------------------------------------------------------------------
// Wrapper component that mounts the sentinel div so refs are populated before
// effects fire.
// ---------------------------------------------------------------------------

function SentinelWrapper({
  options,
  onResult,
}: {
  options: Parameters<typeof useLoadMoreController>[0]
  onResult: (result: ReturnType<typeof useLoadMoreController>) => void
}) {
  const result = useLoadMoreController(options)
  onResult(result)
  return createElement('div', {
    ref: result.sentinelRef,
    'data-testid': 'sentinel',
  })
}

function renderSentinelWrapper(
  options: Parameters<typeof useLoadMoreController>[0],
  onResult: (result: ReturnType<typeof useLoadMoreController>) => void,
) {
  return render(createElement(SentinelWrapper, { options, onResult }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLoadMoreController', () => {
  beforeEach(setupIntersectionObserverMock)
  afterEach(() => vi.unstubAllGlobals())

  describe('derived state', () => {
    it('starts with auto mode enabled and showLoadMore false', () => {
      const { result } = renderHook(() =>
        useLoadMoreController({
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
        }),
      )

      expect(result.current.autoEnabled).toBe(true)
      expect(result.current.showLoadMore).toBe(false)
    })

    it('initializes autoRemaining to the default autoLoadsBeforeManual value', () => {
      const { result } = renderHook(() =>
        useLoadMoreController({
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
        }),
      )

      expect(result.current.autoRemaining).toBe(2)
    })

    it('respects a custom autoLoadsBeforeManual value', () => {
      const { result } = renderHook(() =>
        useLoadMoreController({
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
          autoLoadsBeforeManual: 5,
        }),
      )

      expect(result.current.autoRemaining).toBe(5)
    })

    it('showLoadMore is false when there is no next page', () => {
      const { result } = renderHook(() =>
        useLoadMoreController({
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
          autoLoadsBeforeManual: 0,
        }),
      )

      expect(result.current.showLoadMore).toBe(false)
    })
  })

  describe('IntersectionObserver setup conditions', () => {
    it('does not create an observer when there is no next page', () => {
      renderSentinelWrapper(
        {
          hasNextPage: false,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
        },
        () => {},
      )

      expect(observerInstances).toHaveLength(0)
    })

    it('does not create an observer while a fetch is already in progress', () => {
      renderSentinelWrapper(
        {
          hasNextPage: true,
          isFetchingNextPage: true,
          fetchNextPage: vi.fn(),
        },
        () => {},
      )

      expect(observerInstances).toHaveLength(0)
    })

    it('creates an observer and observes the sentinel when conditions are met', () => {
      renderSentinelWrapper(
        {
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage: vi.fn(),
        },
        () => {},
      )

      expect(observerInstances).toHaveLength(1)
      expect(observerInstances[0].observe).toHaveBeenCalledOnce()
    })
  })

  describe('intersection behavior', () => {
    it('calls fetchNextPage when the sentinel enters the viewport', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue(undefined)

      renderSentinelWrapper(
        { hasNextPage: true, isFetchingNextPage: false, fetchNextPage },
        () => {},
      )

      await act(() => fireIntersection(true))

      expect(fetchNextPage).toHaveBeenCalledOnce()
    })

    it('does not call fetchNextPage when the sentinel exits the viewport', async () => {
      const fetchNextPage = vi.fn()

      renderSentinelWrapper(
        { hasNextPage: true, isFetchingNextPage: false, fetchNextPage },
        () => {},
      )

      await act(() => fireIntersection(false))

      expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('decrements autoRemaining and activates showLoadMore after exhausting auto loads', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue(undefined)
      let capturedResult!: ReturnType<typeof useLoadMoreController>

      renderSentinelWrapper(
        {
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage,
          autoLoadsBeforeManual: 1,
        },
        (r) => {
          capturedResult = r
        },
      )

      expect(capturedResult.autoEnabled).toBe(true)

      await act(() => fireIntersection(true))

      expect(capturedResult.autoEnabled).toBe(false)
      expect(capturedResult.showLoadMore).toBe(true)
    })
  })

  describe('resetAuto', () => {
    it('restores auto loading after being exhausted', async () => {
      const fetchNextPage = vi.fn().mockResolvedValue(undefined)
      let capturedResult!: ReturnType<typeof useLoadMoreController>

      renderSentinelWrapper(
        {
          hasNextPage: true,
          isFetchingNextPage: false,
          fetchNextPage,
          autoLoadsBeforeManual: 1,
        },
        (r) => {
          capturedResult = r
        },
      )

      // Exhaust auto mode via one intersection
      await act(() => fireIntersection(true))
      expect(capturedResult.autoEnabled).toBe(false)

      // Restore
      act(() => capturedResult.resetAuto())

      expect(capturedResult.autoEnabled).toBe(true)
      expect(capturedResult.autoRemaining).toBe(1)
    })
  })
})
