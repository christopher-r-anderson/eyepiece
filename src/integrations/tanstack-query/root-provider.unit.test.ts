import { afterEach, describe, expect, it, vi } from 'vitest'
import { getContext } from './root-provider'
import { EyepieceApiError } from '@/lib/eyepiece-api-client/client'

// Route loaders lean on the library guard that defaults imperative fetches
// to retry: false. That guard only holds while defaultOptions.queries.retry
// is unset (see the note in root-provider), so these tests fail if a global
// retry option sneaks back in.
describe('imperative fetches are single-attempt', () => {
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

  // the stale path hands already-defaulted options to prefetchQuery, so it
  // is the first place a reintroduced global retry option would slip past
  // per-method mitigations
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
    // run past the backoff ladder (1s/2s/4s) that default retries would use
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
