import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNavigate } from '@tanstack/react-router'
import { useOneShotFormStatus } from './use-one-shot-form-status'

vi.mock('@tanstack/react-router')

describe('useOneShotFormStatus', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  it('does nothing without a status', () => {
    const onStatus = vi.fn()

    const { result } = renderHook(() =>
      useOneShotFormStatus(undefined, onStatus),
    )

    expect(result.current).toBeUndefined()
    expect(onStatus).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('invokes the callback and strips the one-shot params', () => {
    const onStatus = vi.fn()

    renderHook(() => useOneShotFormStatus('sent', onStatus))

    expect(onStatus).toHaveBeenCalledWith('sent')
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '.',
      search: expect.any(Function),
      replace: true,
    })
    const updateSearch = mockNavigate.mock.calls[0][0].search
    expect(
      updateSearch({ next: '/favorites', status: 'sent', formError: 'code' }),
    ).toEqual({ next: '/favorites', status: undefined, formError: undefined })
  })

  it('keeps the seeded status after the param is stripped', () => {
    const { result, rerender } = renderHook(
      (status: 'sent' | undefined) => useOneShotFormStatus(status),
      { initialProps: 'sent' as 'sent' | undefined },
    )

    rerender(undefined)

    expect(result.current).toBe('sent')
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })
})
