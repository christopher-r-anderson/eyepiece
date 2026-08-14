import { describe, expect, it, vi } from 'vitest'
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
  it('fetchQuery makes a single attempt on a retryable error', async () => {
    const { queryClient } = getContext()
    const queryFn = vi
      .fn()
      .mockRejectedValue(new EyepieceApiError('upstream down', 502, undefined))
    await expect(
      queryClient.fetchQuery({ queryKey: ['fail-fast'], queryFn }),
    ).rejects.toThrow('upstream down')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('prefetchInfiniteQuery makes a single attempt on a retryable error', async () => {
    const { queryClient } = getContext()
    const queryFn = vi
      .fn()
      .mockRejectedValue(new EyepieceApiError('upstream down', 502, undefined))
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['fail-fast-infinite'],
      queryFn,
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('a call site passing its own retry still wins', async () => {
    const { queryClient } = getContext()
    const queryFn = vi
      .fn()
      .mockRejectedValue(new EyepieceApiError('upstream down', 502, undefined))
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
