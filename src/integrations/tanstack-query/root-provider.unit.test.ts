import { afterEach, describe, expect, it, vi } from 'vitest'
import { getContext, shouldRetryQuery } from './root-provider'
import { EyepieceApiError } from '@/lib/eyepiece-api-client/client'

describe('shouldRetryQuery', () => {
  it('never retries a 4xx api error', () => {
    for (const status of [400, 403, 404, 408]) {
      const error = new EyepieceApiError('nope', status, undefined)
      expect(shouldRetryQuery(0, error)).toBe(false)
    }
  })

  it('retries a 429 up to three times', () => {
    const error = new EyepieceApiError('rate limited', 429, undefined)
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })

  it('retries a 5xx api error up to three times', () => {
    const error = new EyepieceApiError('upstream down', 502, undefined)
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })

  it('retries errors that carry no status up to three times', () => {
    const error = new Error('network hiccup')
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })
})

describe('imperative fetches stay fail-fast under the retry policy', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const failingQueryFn = () =>
    vi
      .fn()
      .mockRejectedValue(new EyepieceApiError('upstream down', 502, undefined))

  it('fetchQuery makes a single attempt on a retryable error', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await expect(
      queryClient.fetchQuery({ queryKey: ['fail-fast'], queryFn }),
    ).rejects.toThrow('upstream down')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('prefetchQuery makes a single attempt on a retryable error', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await queryClient.prefetchQuery({
      queryKey: ['fail-fast-prefetch'],
      queryFn,
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('prefetchInfiniteQuery makes a single attempt on a retryable error', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['fail-fast-infinite'],
      queryFn,
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('ensureQueryData makes a single attempt on a cache miss', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await expect(
      queryClient.ensureQueryData({ queryKey: ['fail-fast-ensure'], queryFn }),
    ).rejects.toThrow('upstream down')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('ensureInfiniteQueryData makes a single attempt on a cache miss', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await expect(
      queryClient.ensureInfiniteQueryData({
        queryKey: ['fail-fast-ensure-infinite'],
        queryFn,
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }),
    ).rejects.toThrow('upstream down')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  // the stale path hands already-defaulted options to prefetchQuery, past
  // the fetchQuery guard - this pins the ensureQueryData override
  it('ensureQueryData revalidateIfStale revalidates with a single attempt', async () => {
    vi.useFakeTimers()
    const { queryClient } = getContext()
    const queryKey = ['fail-fast-revalidate']
    queryClient.setQueryData(queryKey, 'cached')
    const queryFn = failingQueryFn()
    await expect(
      queryClient.ensureQueryData({
        queryKey,
        queryFn,
        revalidateIfStale: true,
      }),
    ).resolves.toBe('cached')
    // run past the default backoff ladder (1s/2s/4s) a ladder would use
    await vi.advanceTimersByTimeAsync(10_000)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('a call site passing its own retry still wins', async () => {
    const { queryClient } = getContext()
    const queryFn = failingQueryFn()
    await expect(
      queryClient.fetchQuery({
        queryKey: ['fail-fast-opt-in'],
        queryFn,
        retry: 1,
        retryDelay: 0,
      }),
    ).rejects.toThrow('upstream down')
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})
