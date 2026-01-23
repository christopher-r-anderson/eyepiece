import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from './use-countdown'

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('counts down once per second', () => {
    const { result } = renderHook(() => useCountdown(3))

    expect(result.current[0]).toBe(3)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current[0]).toBe(2)
  })

  it('resets when initialSeconds changes', () => {
    const { result, rerender } = renderHook(
      ({ start }) => useCountdown(start),
      { initialProps: { start: 5 } },
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current[0]).toBe(3)

    rerender({ start: 8 })
    expect(result.current[0]).toBe(8)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current[0]).toBe(7)
  })

  it('invokes onComplete once per countdown', () => {
    const onComplete = vi.fn()
    const { rerender } = renderHook(
      ({ start }) => useCountdown(start, { onComplete }),
      { initialProps: { start: 1 } },
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)

    rerender({ start: 2 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('can defer start when autoStart is false', () => {
    const { result } = renderHook(() => useCountdown(2, { autoStart: false }))

    expect(result.current[0]).toBe(2)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current[0]).toBe(2)

    act(() => {
      result.current[1].start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current[0]).toBe(1)
  })
})
